/**
 * How 3D landmarks are shaded relative to the base map. Every mode renders the
 * landmarks as maplibre-style fill-extrusion buildings:
 * - `inherited`: mirrors the colour, opacity and vertical gradient of the basemap 3D building layer (default).
 * - `dark`: uses the 3D building look of the SDK's standard dark style.
 * - `light`: uses the 3D building look of the SDK's standard light style.
 *
 * @group Landmarks 3D
 */
export type Landmarks3DDisplayMode = 'inherited' | 'dark' | 'light';

/**
 * The fill-extrusion look landmarks are shaded with: a 3D building layer's colour,
 * `fill-extrusion-opacity` and `fill-extrusion-vertical-gradient`.
 *
 * @group Landmarks 3D
 */
export type BuildingMaterial = {
    diffuseColor: string;
    opacity: number;
    verticalGradient: boolean;
};

// The `3D - Building` look of the SDK's standard light/dark styles.
const STANDARD_LIGHT_BUILDINGS: BuildingMaterial = {
    diffuseColor: 'hsl(38, 6%, 90%)',
    opacity: 0.7,
    verticalGradient: true,
};
const STANDARD_DARK_BUILDINGS: BuildingMaterial = {
    diffuseColor: 'hsl(210, 9%, 17%)',
    opacity: 0.7,
    verticalGradient: true,
};

/**
 * Resolves a display mode to the material to apply on the models layer.
 *
 * @param mode - The display mode to resolve.
 * @param basemapMaterial - What the `inherited` mode could read off the basemap building layer.
 * The standard light look fills in whatever it lacks, and all of it when `null` (the layer is
 * absent, or its colour does not resolve to one value).
 *
 * @group Landmarks 3D
 */
export const resolveDisplayMode = (
    mode: Landmarks3DDisplayMode,
    basemapMaterial: Partial<BuildingMaterial> | null,
): BuildingMaterial => {
    switch (mode) {
        case 'dark':
            return STANDARD_DARK_BUILDINGS;
        case 'light':
            return STANDARD_LIGHT_BUILDINGS;
        default:
            return { ...STANDARD_LIGHT_BUILDINGS, ...basemapMaterial };
    }
};
