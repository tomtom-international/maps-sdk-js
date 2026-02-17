/**
 * @module map-agent-tools
 */

import { z } from 'zod';

/**
 * Parameter metadata extracted from Zod schema.
 */
export type ParameterMetadata = {
    name: string;
    type: string;
    required: boolean;
    description: string;
};

/**
 * Extract parameter metadata from a Zod schema.
 */
export function extractParametersFromSchema(schema: z.ZodType): ParameterMetadata[] {
    if (!(schema instanceof z.ZodObject)) return [];

    const shape = schema.shape;

    return Object.entries(shape).map(([name, zodType]) => {
        const type = zodType as z.ZodTypeAny;
        const isOptional = type instanceof z.ZodOptional;
        const baseType = isOptional ? type.unwrap() : type;

        return {
            name,
            type: getZodTypeString(baseType as z.ZodTypeAny),
            required: !isOptional,
            description: (baseType as any).description || '',
        };
    });
}

/**
 * Get a human-readable type string from a Zod type.
 */
function getZodTypeString(zodType: z.ZodTypeAny): string {
    if (zodType instanceof z.ZodArray) {
        const elementType = getZodTypeString(zodType.element as z.ZodTypeAny);
        return `${elementType}[]`;
    }

    if (zodType instanceof z.ZodString) return 'string';
    if (zodType instanceof z.ZodNumber) return 'number';
    if (zodType instanceof z.ZodBoolean) return 'boolean';
    if (zodType instanceof z.ZodObject) return 'object';
    if (zodType instanceof z.ZodUnion) return 'union';
    if (zodType instanceof z.ZodEnum) return 'enum';
    if (zodType instanceof z.ZodLiteral) return 'literal';
    if (zodType instanceof z.ZodAny) return 'any';

    return 'unknown';
}
