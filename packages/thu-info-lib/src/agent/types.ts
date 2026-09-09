/** JSON-only contracts. Importing metadata never starts a portal session. */
export interface JsonSchema {
    type?: string;
    description?: string;
    enum?: (string | number | boolean | null)[];
    anyOf?: JsonSchema[];
    properties?: Record<string, JsonSchema>;
    required?: string[];
    additionalProperties?: boolean | JsonSchema;
    items?: JsonSchema | JsonSchema[];
    minItems?: number;
    maxItems?: number;
    minimum?: number;
    maximum?: number;
    pattern?: string;
}

export interface ToolPolicy {
    category: string;
    effect: "read" | "write";
    impact: "routine" | "confirm";
    mode: "direct" | "wrapper" | "interactive" | "internal";
    description: string;
    lock?: "report" | "finance" | "physicalExam";
    route?: string;
    reason?: string;
    /** A native flow owns the entire operation; these parameters never reach the model. */
    privateArgs?: string[];
    result?: "json" | "document" | "news" | "schedule";
}

export interface ToolDescriptor extends ToolPolicy {
    name: string;
    path: string;
    parameters: string[];
    inputSchema: JsonSchema;
    outputSchema: JsonSchema;
    version: string;
}
