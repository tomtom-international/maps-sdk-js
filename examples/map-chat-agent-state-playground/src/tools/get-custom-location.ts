import type { ToolEntry } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { z } from 'zod';
import customLocations from './custom-locations.json';

const customLocationSchema = z.object({
    name: z.string().describe('Saved location name, id, or alias (for example: home, office, work)'),
});

export const getCustomLocationTool: ToolEntry = {
    description:
        'Get one of the user-defined saved locations from local data (e.g. home, office). Returns coordinates as [longitude, latitude]. If no location is found, then other tools like geocoding or search should be used.',
    inputSchema: customLocationSchema,
    classificationPrompt: 'Retrieve saved/bookmarked user locations (e.g. home, office)',
    execute: async (params: z.infer<typeof customLocationSchema>, _state) => {
        const { name } = params;
        const query = name.trim().toLowerCase();

        const match = customLocations.find(
            (location) =>
                location.id.toLowerCase() === query ||
                location.name.toLowerCase() === query ||
                (location.aliases ?? []).some((alias) => alias.toLowerCase() === query),
        );

        if (!match) {
            return {
                error: `Saved location "${name}" not found`,
                availableLocations: customLocations.map((location) => location.id),
            };
        }

        return {
            id: match.id,
            name: match.name,
            position: match.position,
            address: match.address,
            description: match.description,
        };
    },
};
