/* Build-time reflection only. Run with --check in CI; never load this in Metro. */
/* eslint-disable @typescript-eslint/no-require-imports */
const ts = require("typescript");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");

const root = path.resolve(__dirname, "..");
const entry = path.join(root, "src/index.ts");
const metadataPath = path.join(root, "src/agent/metadata.ts");
const outputPath = path.join(root, "src/agent/generated.ts");
const config = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const program = ts.createProgram([entry], parsed.options);
const checker = program.getTypeChecker();
const source = program.getSourceFile(entry);
const helper = source.statements.find((s) => ts.isClassDeclaration(s) && s.name.text === "InfoHelper");
const helperType = checker.getTypeAtLocation(helper);
const metadataSource = fs.readFileSync(metadataPath, "utf8");
const metadataModule = {exports: {}};
vm.runInNewContext(ts.transpileModule(metadataSource, {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
}).outputText, {exports: metadataModule.exports, module: metadataModule});
const metadata = metadataModule.exports.agentMetadata;

function schemaFor(type, input, seen = new Set()) {
    if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
        if (input) throw new Error(`Exposed input needs an explicit JSON wrapper: ${checker.typeToString(type)}`);
        return {}; // Upstream untyped result: the app still bounds and sanitizes it.
    }
    if (type.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined)) return {type: "null"};
    if (type.flags & ts.TypeFlags.Null) return {type: "null"};
    if (type.flags & ts.TypeFlags.StringLiteral) return {type: "string", enum: [type.value]};
    if (type.flags & ts.TypeFlags.NumberLiteral) return {type: "number", enum: [type.value]};
    if (type.flags & ts.TypeFlags.BooleanLiteral) return {type: "boolean", enum: [type.intrinsicName === "true"]};
    if (type.flags & ts.TypeFlags.String) return {type: "string"};
    if (type.flags & ts.TypeFlags.Number) return {type: "number"};
    if (type.flags & ts.TypeFlags.Boolean) return {type: "boolean"};
    if (type.isUnion()) {
        const branches = type.types.filter((t) => !(t.flags & ts.TypeFlags.Undefined));
        const schemas = branches.map((t) => schemaFor(t, input, seen));
        if (schemas.length === 1) return schemas[0];
        if (schemas.every((s) => s.type === schemas[0].type && s.enum)) {
            return {type: schemas[0].type, enum: schemas.flatMap((s) => s.enum)};
        }
        return {anyOf: schemas};
    }
    const name = type.symbol?.name;
    if (name === "Date" || name === "Dayjs") return {type: "string", description: "ISO 8601 date/time"};
    if (checker.isTupleType(type)) {
        const args = checker.getTypeArguments(type);
        return {type: "array", items: args.map((t) => schemaFor(t, input, seen)), minItems: type.target.minLength, maxItems: args.length};
    }
    if (checker.isArrayType(type)) return {type: "array", items: schemaFor(checker.getTypeArguments(type)[0], input, seen)};
    if (seen.has(type)) {
        if (input) throw new Error(`Recursive input requires a wrapper: ${name}`);
        return {};
    }
    const nested = new Set(seen).add(type);
    const properties = {};
    const required = [];
    for (const property of checker.getPropertiesOfType(type)) {
        const declaration = property.valueDeclaration ?? property.declarations?.[0];
        if (!declaration) continue;
        if (ts.getCombinedModifierFlags(declaration) & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected)) continue;
        const propertyType = checker.getTypeOfSymbolAtLocation(property, declaration);
        if (checker.getSignaturesOfType(propertyType, ts.SignatureKind.Call).length) {
            if (input) throw new Error(`Class input requires a wrapper: ${name}.${property.name}`);
            continue;
        }
        properties[property.name] = schemaFor(propertyType, input, nested);
        if (!(property.flags & ts.SymbolFlags.Optional) && !(propertyType.isUnion() && propertyType.types.some((t) => t.flags & ts.TypeFlags.Undefined))) required.push(property.name);
    }
    const index = checker.getIndexTypeOfType(type, ts.IndexKind.String);
    return {type: "object", properties, required, additionalProperties: index ? schemaFor(index, input, nested) : false};
}

const catalog = [];
const bindings = [];
const callableNames = [];
for (const member of checker.getPropertiesOfType(helperType)) {
    const declaration = member.valueDeclaration;
    const signature = checker.getSignaturesOfType(checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(member, declaration)), ts.SignatureKind.Call)[0];
    if (!signature) continue;
    callableNames.push(member.name);
    const policy = metadata[member.name];
    if (!policy) throw new Error(`Missing agent classification: ${member.name}`);
    if (policy.mode === "internal") continue;
    const parameters = [];
    const properties = {};
    const required = [];
    for (const parameter of signature.parameters) {
        const node = parameter.valueDeclaration;
        parameters.push(parameter.name);
        if (policy.privateArgs?.includes(parameter.name)) continue;
        const type = checker.getTypeOfSymbolAtLocation(parameter, node);
        properties[parameter.name] = schemaFor(type, true);
        const doc = ts.displayPartsToString(parameter.getDocumentationComment(checker));
        if (doc) properties[parameter.name].description = doc.replace(/<[^>]*>/g, "");
        if (node.initializer && (ts.isNumericLiteral(node.initializer) || node.initializer.kind === ts.SyntaxKind.TrueKeyword || node.initializer.kind === ts.SyntaxKind.FalseKeyword || ts.isStringLiteral(node.initializer))) {
            properties[parameter.name].description = `${properties[parameter.name].description ?? ""} Default: ${node.initializer.getText()}`.trim();
        }
        const optional = node.questionToken || node.initializer || (type.isUnion() && type.types.some((t) => t.flags & ts.TypeFlags.Undefined));
        if (!optional) required.push(parameter.name);
    }
    let inputSchema = {type: "object", properties, required, additionalProperties: false};
    if (["saveCustomSchedule", "deleteCustomSchedule"].includes(member.name)) {
        inputSchema = {type: "object", properties: {scheduleIds: {type: "array", items: {type: "string"}, minItems: 1, maxItems: 20}}, required: ["scheduleIds"], additionalProperties: false};
    }
    const resultType = checker.getAwaitedType(checker.getReturnTypeOfSignature(signature));
    const outputSchema = policy.mode === "interactive" ? {type: "object", properties: {status: {type: "string"}, route: {type: "string"}}} : schemaFor(resultType, false);
    const doc = ts.displayPartsToString(member.getDocumentationComment(checker)).replace(/<[^>]*>/g, "");
    const description = `${policy.description}${doc ? `. ${doc}` : ""}`;
    const version = crypto.createHash("sha256").update(JSON.stringify({policy, inputSchema, outputSchema, description})).digest("hex").slice(0, 16);
    catalog.push({...policy, description, name: member.name, path: `${policy.category}.${member.name}`, parameters, inputSchema, outputSchema, version});
    // Only statically enumerated direct/JSON-compatible wrappers can call InfoHelper.
    if (policy.mode !== "interactive" && !["saveCustomSchedule", "deleteCustomSchedule"].includes(member.name)) {
        bindings.push(`    ${member.name}: (helper${parameters.length ? ", args" : ""}) => helper.${member.name}(${parameters.map((p, i) => `args[${JSON.stringify(p)}] as Parameters<InfoHelper["${member.name}"]>[${i}]`).join(", ")}),`);
    }
}
for (const name of Object.keys(metadata)) if (!callableNames.includes(name)) throw new Error(`Stale metadata: ${name}`);
const generated = `/* Generated by scripts/generate-agent.cjs. Do not edit. */\nimport type {InfoHelper} from "../index";\nimport type {ToolDescriptor} from "./types";\n\nexport const agentCatalog: ToolDescriptor[] = ${JSON.stringify(catalog, null, 4)};\n\nexport const agentBindings: Record<string, (helper: InfoHelper, args: Record<string, unknown>) => unknown> = {\n${bindings.join("\n")}\n};\n`;
if (process.argv.includes("--check")) {
    if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== generated) throw new Error("Agent catalog is stale. Run yarn workspace @thu-info/lib agent:generate");
} else {
    fs.writeFileSync(outputPath, generated);
}
console.log(`${catalog.length} agent tools; ${callableNames.length - catalog.length} internal callables classified.`);
