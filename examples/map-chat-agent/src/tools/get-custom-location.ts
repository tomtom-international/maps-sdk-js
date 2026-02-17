import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';

const customLocationSchema = z.object({
    name: z.string().describe('Saved location name, id, or alias (for example: home, office, work)'),
});

export const getCustomLocationTool: Tool = dynamicTool({
    description:
        'Get one of the user-defined saved locations from local data (e.g. home, office). Returns coordinates as [longitude, latitude].',
    inputSchema: customLocationSchema,
    execute: async (params) => {
        const { name } = params as z.infer<typeof customLocationSchema>;

        try {
            const response = await fetch(new URL('../custom-locations.json', import.meta.url));
            if (!response.ok) {
                return { error: `Failed to load custom locations: ${response.status}` };
            }

            const locations = (await response.json()) as Array<{
                id: string;
                name: string;
                aliases?: string[];
                position: [number, number];
                address?: string;
                description?: string;
            }>;

            const query = name.trim().toLowerCase();
            const match = locations.find((location) => {
                return (
                    location.id.toLowerCase() === query ||
                    location.name.toLowerCase() === query ||
                    (location.aliases ?? []).some((alias) => alias.toLowerCase() === query)
                );
            });

            if (!match) {
                return {
                    error: `Saved location "${name}" not found`,
                    availableLocations: locations.map((location) => location.id),
                };
            }

            return {
                id: match.id,
                name: match.name,
                position: match.position,
                address: match.address,
                description: match.description,
            };
        } catch (error) {
            return {
                error: `Failed to read custom locations: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    },
});
