import {
    Color,
    CustomBlending,
    DoubleSide,
    FrontSide,
    OneFactor,
    OneMinusSrcAlphaFactor,
    ShaderMaterial,
    SRGBColorSpace,
    type Texture,
    Vector3,
} from 'three';

const VERTEX_SHADER = /* glsl */ `
    varying vec3 vWorldNormal;
    #ifdef USE_ALPHA_MASK
    varying vec2 vUv;
    #endif

    void main() {
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        #ifdef USE_ALPHA_MASK
        vUv = uv;
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Samples the as-authored texture alpha so untextured shading keeps the mesh's carved silhouette.
const ALPHA_MASK_FRAGMENT_CHUNK = /* glsl */ `
    #ifdef USE_ALPHA_MASK
    uniform sampler2D alphaMask;
    uniform float alphaMaskCutoff;
    varying vec2 vUv;
    #endif
`;

const ALPHA_MASK_MAIN_CHUNK = /* glsl */ `
        #ifdef USE_ALPHA_MASK
        if (texture2D(alphaMask, vUv).a < alphaMaskCutoff) {
            discard;
        }
        #endif
`;

// Per-fragment replica of maplibre's fill_extrusion shading, in sRGB on the raw paint colour (no tone-mapping).
const FRAGMENT_SHADER = /* glsl */ `
    uniform vec3 diffuseColor;
    uniform vec3 lightPosition;
    uniform float lightIntensity;
    uniform vec3 lightColor;
    uniform float layerOpacity;
    varying vec3 vWorldNormal;
    ${ALPHA_MASK_FRAGMENT_CHUNK}

    void main() {
        ${ALPHA_MASK_MAIN_CHUNK}
        vec3 normal = normalize(vWorldNormal);
        float colorValue = dot(diffuseColor, vec3(0.2126, 0.7152, 0.0722));
        // Flat ambient term lifting the paint colour, tuned to match the basemap buildings.
        vec3 color = diffuseColor + vec3(0.145);
        float directional = clamp(dot(normal, lightPosition), 0.0, 1.0);
        directional = mix(1.0 - lightIntensity, max(1.0 - colorValue + lightIntensity, 1.0), directional);
        // Side faces (walls) darken to 0.9; roofs (normal +Z) stay full bright.
        float wallFactor = 1.0 - abs(normal.z);
        directional *= mix(1.0, 0.9, wallFactor);
        vec3 shaded = clamp(
            color * directional * lightColor,
            mix(vec3(0.0), vec3(0.3), vec3(1.0) - lightColor),
            vec3(1.0)
        );
        gl_FragColor = vec4(shaded, 1.0) * layerOpacity;
    }
`;

// Maplibre's default style light position [1.15, 210, 30] as a cartesian vector.
const DEFAULT_LIGHT_POSITION = new Vector3(0.2875, -0.498, 0.996);

const parsedColor = new Color();
const srgbColor = new Color();

/**
 * Alpha mask carried over from a landmark mesh's as-authored texture.
 *
 * Landmark meshes are coarse hulls (e.g. a wall is one rectangle) whose realistic
 * silhouette is carved out by the texture's alpha channel. Untextured shading must keep
 * sampling that alpha and discard the carved-away fragments, otherwise the raw hull
 * shape gets coloured in.
 *
 * @group Landmarks 3D
 */
export type FillExtrusionAlphaMask = {
    /** Texture whose alpha channel carves the mesh silhouette (the mesh's base colour map). */
    map: Texture;
    /** Fragments with alpha below this are discarded. */
    cutoff: number;
};

/**
 * Material that shades untextured landmark meshes exactly like maplibre-gl shades
 * `fill-extrusion` buildings, so they blend in with the basemap building layer.
 *
 * Colour and opacity premultiply like maplibre's `v_color *= u_opacity`, paired with
 * (ONE, ONE_MINUS_SRC_ALPHA) blending. Backfaces are culled like maplibre's extrusion
 * rendering, except for alpha-masked meshes whose cutout surfaces must stay visible from
 * both sides; pair with {@link FillExtrusionDepthMaterial} as a depth prepass so that
 * translucent landmarks blend with the basemap exactly once per pixel.
 *
 * @group Landmarks 3D
 */
export class FillExtrusionMaterial extends ShaderMaterial {
    constructor(alphaMask?: FillExtrusionAlphaMask) {
        super({
            uniforms: {
                diffuseColor: { value: new Vector3(1, 1, 1) },
                lightPosition: { value: DEFAULT_LIGHT_POSITION.clone() },
                lightIntensity: { value: 0.5 },
                lightColor: { value: new Vector3(1, 1, 1) },
                layerOpacity: { value: 1 },
                ...(alphaMask && {
                    alphaMask: { value: alphaMask.map },
                    alphaMaskCutoff: { value: alphaMask.cutoff },
                }),
            },
            ...(alphaMask && { defines: { USE_ALPHA_MASK: '' } }),
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
            side: alphaMask ? DoubleSide : FrontSide,
            transparent: true,
            blending: CustomBlending,
            blendSrc: OneFactor,
            blendDst: OneMinusSrcAlphaFactor,
        });
    }

    /**
     * Copies the shading uniforms (colour, light, layer opacity) from another instance,
     * bringing a freshly created alpha-masked variant up to date with the shared material.
     */
    copyShadingFrom(source: FillExtrusionMaterial): void {
        (this.uniforms.diffuseColor.value as Vector3).copy(source.uniforms.diffuseColor.value as Vector3);
        (this.uniforms.lightPosition.value as Vector3).copy(source.uniforms.lightPosition.value as Vector3);
        this.uniforms.lightIntensity.value = source.uniforms.lightIntensity.value;
        (this.uniforms.lightColor.value as Vector3).copy(source.uniforms.lightColor.value as Vector3);
        this.uniforms.layerOpacity.value = source.uniforms.layerOpacity.value;
    }

    /**
     * Sets the building colour from a CSS colour string, stored as raw sRGB
     * components — maplibre shades paint colours in sRGB space, not linear.
     */
    setDiffuseColor(cssColor: string): void {
        parsedColor.setStyle(cssColor);
        parsedColor.getRGB(srgbColor, SRGBColorSpace);
        (this.uniforms.diffuseColor.value as Vector3).set(srgbColor.r, srgbColor.g, srgbColor.b);
    }

    setLayerOpacity(opacity: number): void {
        this.uniforms.layerOpacity.value = opacity;
    }

    /**
     * Mirrors maplibre's fill-extrusion light uniforms: the style light position is
     * rotated by the map bearing for viewport-anchored lights and the light vector is
     * deliberately left unnormalised, exactly like maplibre's `u_lightpos`.
     *
     * @param position - The style light position, in maplibre's y-south axes.
     * @param bearingInRadians - Map bearing to rotate by; pass `0` for map-anchored lights.
     * @param intensity - The style light intensity.
     * @param color - The style light colour.
     */
    setLight(
        position: { x: number; y: number; z: number },
        bearingInRadians: number,
        intensity: number,
        color: { r: number; g: number; b: number },
    ): void {
        const cosine = Math.cos(bearingInRadians);
        const sine = Math.sin(bearingInRadians);
        (this.uniforms.lightPosition.value as Vector3).set(
            position.x * cosine - position.y * sine,
            position.x * sine + position.y * cosine,
            position.z,
        );
        this.uniforms.lightIntensity.value = intensity;
        (this.uniforms.lightColor.value as Vector3).set(color.r, color.g, color.b);
    }
}

/**
 * Depth-only prepass companion to {@link FillExtrusionMaterial}. Rendering the scene
 * with this material first fills the depth buffer with the nearest landmark surfaces,
 * so the colour pass shades each pixel exactly once — overlapping translucent walls
 * don't blend on top of each other, mirroring how maplibre's depth-writing
 * fill-extrusion pass keeps buildings from showing through one another.
 *
 * Shares {@link FillExtrusionMaterial}'s vertex shader and alpha mask so both passes
 * produce identical depth values and cut out the same fragments.
 *
 * @group Landmarks 3D
 */
export class FillExtrusionDepthMaterial extends ShaderMaterial {
    constructor(alphaMask?: FillExtrusionAlphaMask) {
        super({
            ...(alphaMask && {
                uniforms: {
                    alphaMask: { value: alphaMask.map },
                    alphaMaskCutoff: { value: alphaMask.cutoff },
                },
                defines: { USE_ALPHA_MASK: '' },
            }),
            vertexShader: VERTEX_SHADER,
            fragmentShader: /* glsl */ `
                ${ALPHA_MASK_FRAGMENT_CHUNK}
                void main() {
                    ${ALPHA_MASK_MAIN_CHUNK}
                    gl_FragColor = vec4(0.0);
                }
            `,
            side: alphaMask ? DoubleSide : FrontSide,
            colorWrite: false,
        });
    }
}
