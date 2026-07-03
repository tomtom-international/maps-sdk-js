/**
 * How 3D landmarks are shaded relative to the base map. Every mode renders the
 * landmarks as maplibre-style fill-extrusion buildings:
 * - `inherited`: mirrors the colour and opacity of the basemap 3D building layer (default).
 * - `dark`: uses the 3D building look of the SDK's standard dark style.
 * - `light`: uses the 3D building look of the SDK's standard light style.
 *
 * @group Landmarks 3D
 */
export type Landmarks3DDisplayMode = 'inherited' | 'dark' | 'light';

/**
 * The colour of the basemap 3D building layer, read from the map style.
 *
 * @group Landmarks 3D
 */
export type BasemapBuildingMaterial = {
    diffuse: string;
};

/**
 * Material state that a {@link Landmarks3DDisplayMode} resolves to on a {@link ModelsLayer}.
 *
 * @group Landmarks 3D
 */
export type LandmarksMaterialState = {
    diffuseColor: string;
    opacity: number;
};

// The `3D - Building` colour fallback of the SDK's standard light/dark styles.
const STANDARD_LIGHT_BUILDINGS: BasemapBuildingMaterial = { diffuse: 'hsl(38, 6%, 90%)' };
const STANDARD_DARK_BUILDINGS: BasemapBuildingMaterial = { diffuse: 'hsl(210, 9%, 17%)' };

// Landmark layer opacity, tuned so the meshes blend with the basemap 3D buildings.
const LANDMARK_OPACITY = 0.82;

/**
 * Resolves a display mode to the concrete material state to apply on the models layer.
 *
 * @param mode - The display mode to resolve.
 * @param basemapMaterial - The basemap building look used by the `inherited` mode.
 * When `null` (basemap building layer absent), `inherited` falls back to the
 * standard light style look.
 *
 * @group Landmarks 3D
 */
export const resolveDisplayMode = (
    mode: Landmarks3DDisplayMode,
    basemapMaterial: BasemapBuildingMaterial | null,
): LandmarksMaterialState => {
    switch (mode) {
        case 'dark':
            return { diffuseColor: STANDARD_DARK_BUILDINGS.diffuse, opacity: LANDMARK_OPACITY };
        case 'light':
            return { diffuseColor: STANDARD_LIGHT_BUILDINGS.diffuse, opacity: LANDMARK_OPACITY };
        default: {
            // 'inherited' — mirror the basemap building colour, falling back to the standard light look.
            const material = basemapMaterial ?? STANDARD_LIGHT_BUILDINGS;
            return { diffuseColor: material.diffuse, opacity: LANDMARK_OPACITY };
        }
    }
};
