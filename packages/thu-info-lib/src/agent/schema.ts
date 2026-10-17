import type {JsonSchema} from "./types";

/** Small non-compiling validator for the schema subset emitted by our generator. */
export const validateSchema = (schema: JsonSchema, value: unknown, path = "input"): string | undefined => {
    if (schema.anyOf) {
        return schema.anyOf.some((branch) => validateSchema(branch, value, path) === undefined)
            ? undefined : `${path}: does not match any allowed type`;
    }
    if (schema.enum && !schema.enum.some((item) => item === value)) return `${path}: invalid enum value`;
    if (schema.type === "null") return value === null ? undefined : `${path}: expected null`;
    if (schema.type === "string") {
        if (typeof value !== "string") return `${path}: expected string`;
        if (schema.pattern && !new RegExp(schema.pattern).test(value)) return `${path}: invalid format`;
    }
    if (schema.type === "number" || schema.type === "integer") {
        if (typeof value !== "number" || !Number.isFinite(value)) return `${path}: expected finite number`;
        if (schema.type === "integer" && !Number.isInteger(value)) return `${path}: expected integer`;
        if (schema.minimum !== undefined && value < schema.minimum) return `${path}: below minimum`;
        if (schema.maximum !== undefined && value > schema.maximum) return `${path}: above maximum`;
    }
    if (schema.type === "boolean" && typeof value !== "boolean") return `${path}: expected boolean`;
    if (schema.type === "array") {
        if (!Array.isArray(value)) return `${path}: expected array`;
        if (schema.minItems !== undefined && value.length < schema.minItems) return `${path}: too few items`;
        if (schema.maxItems !== undefined && value.length > schema.maxItems) return `${path}: too many items`;
        for (let i = 0; i < value.length; i++) {
            const item = Array.isArray(schema.items) ? schema.items[i] : schema.items;
            if (!item) return `${path}: unexpected item`;
            const error = validateSchema(item, value[i], `${path}[${i}]`);
            if (error) return error;
        }
    }
    if (schema.type === "object") {
        if (value === null || typeof value !== "object" || Array.isArray(value)) return `${path}: expected object`;
        const object = value as Record<string, unknown>;
        for (const key of schema.required ?? []) {
            if (!Object.prototype.hasOwnProperty.call(object, key)) return `${path}.${key}: required`;
        }
        for (const key of Object.keys(object)) {
            if (["__proto__", "constructor", "prototype"].includes(key)) return `${path}: unsafe key`;
            const property = Object.prototype.hasOwnProperty.call(schema.properties ?? {}, key)
                ? schema.properties![key] : undefined;
            if (!property && schema.additionalProperties === false) return `${path}.${key}: unexpected property`;
            const subschema = property ?? (typeof schema.additionalProperties === "object" ? schema.additionalProperties : undefined);
            if (subschema) {
                const error = validateSchema(subschema, object[key], `${path}.${key}`);
                if (error) return error;
            }
        }
    }
    return undefined;
};
