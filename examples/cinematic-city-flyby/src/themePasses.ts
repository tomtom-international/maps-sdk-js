import type { MapEffectsPass } from '@tomtom-org/maps-sdk-plugin-map-effects';

// Read every draw: the animated passes move with the clock while the map redraws, and the screen-sized ones
// measure in CSS pixels.
const uniforms = () => ({ uTime: performance.now() / 1000, uPixelRatio: devicePixelRatio });

const HASH = 'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }';

// How sharply the brightness changes around a pixel (Sobel), measured one CSS pixel apart.
const EDGE = `float luma(vec2 uv) { return dot(texture(uSource, uv).rgb, vec3(0.299, 0.587, 0.114)); }
float edge(vec2 uv) {
    vec2 texel = uPixelRatio / vec2(textureSize(uSource, 0));
    float tl = luma(uv + texel * vec2(-1.0, 1.0)), t = luma(uv + texel * vec2(0.0, 1.0)), tr = luma(uv + texel);
    float l = luma(uv - texel * vec2(1.0, 0.0)), r = luma(uv + texel * vec2(1.0, 0.0));
    float bl = luma(uv - texel), b = luma(uv - texel * vec2(0.0, 1.0)), br = luma(uv + texel * vec2(1.0, -1.0));
    return length(vec2(tr + 2.0 * r + br - tl - 2.0 * l - bl, tl + 2.0 * t + tr - bl - 2.0 * b - br));
}`;

/** The city in green phosphor, its edges traced in a brighter green that the bloom then lights. */
export const greenPhosphor: MapEffectsPass = {
    id: 'green-phosphor',
    uniforms,
    fragment: `uniform float uPixelRatio;
${EDGE}
void main() {
    vec4 colour = texture(uSource, vUv);
    vec3 phosphor = vec3(0.12, 1.0, 0.38) * pow(luma(vUv), 0.9) * 1.1;
    float traced = smoothstep(0.25, 0.6, edge(vUv));
    fragColor = vec4(phosphor + vec3(0.45, 1.0, 0.6) * traced * 0.25, colour.a);
}`,
};

/** A warm glow over the far city and the sky, as if the sun had just set behind it. */
export const sunsetGlow: MapEffectsPass = {
    id: 'sunset-glow',
    fragment: `void main() {
    vec4 colour = texture(uSource, vUv);
    float sky = smoothstep(0.45, 1.0, vUv.y);
    vec3 warm = mix(vec3(1.0, 0.58, 0.32), vec3(0.86, 0.36, 0.58), smoothstep(0.75, 1.0, vUv.y));
    fragColor = vec4(mix(colour.rgb, colour.rgb * 0.55 + warm * 0.6, sky * 0.65), colour.a);
}`,
};

/** Film grain, a flickering exposure and the odd scratch down the frame. */
export const filmGrain: MapEffectsPass = {
    id: 'film-grain',
    placement: 'after-depth-of-field',
    uniforms,
    fragment: `uniform float uTime;
uniform float uPixelRatio;
${HASH}
void main() {
    vec4 colour = texture(uSource, vUv);
    float grain = hash(floor(vUv * vec2(textureSize(uSource, 0)) / uPixelRatio) + fract(uTime) * 917.0) - 0.5;
    float exposure = 1.0 + 0.035 * sin(uTime * 31.0) * sin(uTime * 7.3);
    float frame = floor(uTime * 12.0);
    float scratch = step(0.75, hash(vec2(frame, 9.0))) * (1.0 - smoothstep(0.0, 0.0012, abs(vUv.x - hash(vec2(frame, 5.0)))));
    fragColor = vec4(colour.rgb * exposure + grain * 0.1 + scratch * 0.3, colour.a);
}`,
};

/** White lines along every edge of the city, drawn on blue drafting paper ruled in squares. */
export const blueprintLines: MapEffectsPass = {
    id: 'blueprint-lines',
    uniforms,
    fragment: `uniform float uPixelRatio;
${EDGE}
void main() {
    float lines = smoothstep(0.08, 0.3, edge(vUv));
    vec3 paper = mix(vec3(0.03, 0.15, 0.35), vec3(0.11, 0.34, 0.66), luma(vUv));
    vec2 fromRule = abs(fract(vUv * vec2(textureSize(uSource, 0)) / uPixelRatio / 32.0 - 0.5) - 0.5) * 32.0;
    float rule = 1.0 - smoothstep(0.0, 1.0, min(fromRule.x, fromRule.y));
    fragColor = vec4(mix(paper + rule * 0.07, vec3(0.92, 0.96, 1.0), lines), 1.0);
}`,
};

/** The city toned in sepia, on paper with a fibre to it, like a plate from an old atlas. */
export const paperToning: MapEffectsPass = {
    id: 'paper-toning',
    uniforms,
    fragment: `uniform float uPixelRatio;
${HASH}
void main() {
    vec4 colour = texture(uSource, vUv);
    float lum = dot(colour.rgb, vec3(0.299, 0.587, 0.114));
    vec3 sepia = vec3(lum) * vec3(1.07, 0.95, 0.78);
    vec2 onScreen = vUv * vec2(textureSize(uSource, 0)) / uPixelRatio;
    float fibre = hash(floor(onScreen / vec2(1.0, 3.0))) - 0.5;
    fragColor = vec4(mix(colour.rgb, sepia, 0.45) + fibre * 0.025, colour.a);
}`,
};

/** Slow curtains of green and violet light across the top of the frame, as the northern lights hang over a city. */
export const auroraVeil: MapEffectsPass = {
    id: 'aurora-veil',
    uniforms,
    fragment: `uniform float uTime;
void main() {
    vec4 colour = texture(uSource, vUv);
    float x = vUv.x;
    float height = vUv.y + sin(x * 6.0 + uTime * 0.25) * 0.05 + sin(x * 13.0 - uTime * 0.4) * 0.025;
    float curtain = smoothstep(0.55, 0.85, height) * (1.0 - smoothstep(0.9, 1.05, height));
    float rays = 0.6 + 0.4 * sin(x * 70.0 + sin(x * 9.0 + uTime * 0.3) * 4.0);
    vec3 light = mix(vec3(0.15, 0.95, 0.65), vec3(0.55, 0.3, 1.0), smoothstep(0.75, 1.0, height));
    // Screened over the frame, it lights the dark sky and only tints what is already bright.
    vec3 veil = light * curtain * rays * 0.35;
    fragColor = vec4(1.0 - (1.0 - colour.rgb) * (1.0 - veil), colour.a);
}`,
};

/** Flat inks, Ben-Day dots in the shade and black outlines, as printed in a comic. */
export const popArtInks: MapEffectsPass = {
    id: 'pop-art-inks',
    placement: 'after-depth-of-field',
    uniforms,
    fragment: `uniform float uPixelRatio;
${EDGE}
void main() {
    vec3 colour = texture(uSource, vUv).rgb;
    vec3 inks = floor(colour * 4.0 + 0.5) / 4.0;
    float lum = dot(colour, vec3(0.299, 0.587, 0.114));
    vec2 onScreen = vUv * vec2(textureSize(uSource, 0)) / uPixelRatio;
    vec2 inDot = fract(mat2(0.7071, -0.7071, 0.7071, 0.7071) * onScreen / 7.0) - 0.5;
    float radius = sqrt(1.0 - lum) * 0.55;
    float halftone = 1.0 - smoothstep(radius - 0.08, radius + 0.08, length(inDot));
    vec3 printed = mix(inks, inks * 0.5, halftone * 0.7);
    fragColor = vec4(mix(printed, vec3(0.05), smoothstep(0.15, 0.4, edge(vUv))), 1.0);
}`,
};

/** Instant film: lifted blacks, cyan shadows, warm highlights, and a light leak drifting in at one corner. */
export const instantFilm: MapEffectsPass = {
    id: 'instant-film',
    placement: 'after-depth-of-field',
    uniforms,
    fragment: `uniform float uTime;
void main() {
    vec4 colour = texture(uSource, vUv);
    float lum = dot(colour.rgb, vec3(0.299, 0.587, 0.114));
    vec3 film = mix(vec3(0.08, 0.07, 0.06), vec3(0.96, 0.94, 0.88), colour.rgb);
    film += mix(vec3(-0.02, 0.02, 0.04), vec3(0.04, 0.02, -0.03), lum);
    float leak = exp(-4.0 * distance(vUv, vec2(1.05, 0.95 + 0.05 * sin(uTime * 0.2))));
    fragColor = vec4(film + vec3(1.0, 0.45, 0.2) * leak * 0.18, colour.a);
}`,
};

/** A lens that splits red from blue towards the corners of the frame. */
export const chromaticFringe: MapEffectsPass = {
    id: 'chromatic-fringe',
    placement: 'after-depth-of-field',
    fragment: `void main() {
    vec2 fromCentre = vUv - 0.5;
    vec2 shift = fromCentre * dot(fromCentre, fromCentre) * 0.02;
    vec4 colour = texture(uSource, vUv);
    fragColor = vec4(texture(uSource, vUv + shift).r, colour.g, texture(uSource, vUv - shift).b, colour.a);
}`,
};

/** A cathode-ray screen: its faint scanlines and its colours a pixel out of register. */
export const crtScanlines: MapEffectsPass = {
    id: 'crt-scanlines',
    placement: 'after-depth-of-field',
    uniforms,
    fragment: `uniform float uPixelRatio;
void main() {
    vec2 size = vec2(textureSize(uSource, 0));
    vec2 split = vec2(uPixelRatio / size.x, 0.0);
    vec4 colour = texture(uSource, vUv);
    vec3 screen = vec3(texture(uSource, vUv + split).r, colour.g, texture(uSource, vUv - split).b);
    fragColor = vec4(screen * (0.95 + 0.05 * sin(vUv.y * size.y / uPixelRatio * 3.14159)), colour.a);
}`,
};

/** Hot air shimmering faintly over the far city, just under the horizon. */
export const heatHaze: MapEffectsPass = {
    id: 'heat-haze',
    uniforms,
    fragment: `uniform float uTime;
void main() {
    float strength = smoothstep(0.6, 0.75, vUv.y) * (1.0 - smoothstep(0.8, 0.92, vUv.y)) * 0.0005;
    vec2 wobble = vec2(sin(vUv.y * 60.0 + uTime * 1.5), cos(vUv.x * 50.0 + uTime * 1.2)) * strength;
    fragColor = texture(uSource, vUv + wobble);
}`,
};

/** Infrared colour film: the foliage turns rose, the rest keeps its colours. */
export const aerochrome: MapEffectsPass = {
    id: 'aerochrome',
    fragment: `void main() {
    vec4 colour = texture(uSource, vUv);
    float foliage = clamp((colour.g - max(colour.r, colour.b)) * 4.0, 0.0, 1.0);
    float lum = dot(colour.rgb, vec3(0.299, 0.587, 0.114));
    vec3 rose = vec3(0.95, 0.3, 0.5) * (0.6 + 0.6 * lum);
    fragColor = vec4(mix(colour.rgb, rose, foliage * 0.85), colour.a);
}`,
};

/** An anamorphic lens: every bright light stretched into a thin blue streak across the frame. */
export const anamorphicFlare: MapEffectsPass = {
    id: 'anamorphic-flare',
    placement: 'after-depth-of-field',
    fragment: `void main() {
    vec4 colour = texture(uSource, vUv);
    vec2 texel = vec2(1.0 / float(textureSize(uSource, 0).x), 0.0);
    vec3 streak = vec3(0.0);
    // The taps spread quadratically, so 16 each way reach far while staying dense near the light.
    for (int i = 1; i <= 16; i++) {
        vec2 offset = texel * float(i * i);
        float weight = 1.0 - float(i) / 17.0;
        streak += (max(texture(uSource, vUv + offset).rgb - 0.7, 0.0) + max(texture(uSource, vUv - offset).rgb - 0.7, 0.0)) * weight;
    }
    fragColor = vec4(colour.rgb + streak * vec3(0.35, 0.55, 1.0) * 0.12, colour.a);
}`,
};

/** Slide film: its red halo around the highlights, its deep reds and blues, and its grain. */
export const filmHalation: MapEffectsPass = {
    id: 'film-halation',
    placement: 'after-depth-of-field',
    uniforms,
    fragment: `uniform float uTime;
uniform float uPixelRatio;
${HASH}
void main() {
    vec2 size = vec2(textureSize(uSource, 0));
    vec2 texel = uPixelRatio * 4.0 / size;
    vec4 colour = texture(uSource, vUv);
    vec3 glow = vec3(0.0);
    for (int i = 0; i < 8; i++) {
        float angle = float(i) * 0.785398;
        glow += max(texture(uSource, vUv + vec2(cos(angle), sin(angle)) * texel).rgb - 0.65, 0.0);
    }
    vec3 slide = colour.rgb + vec3(1.0, 0.25, 0.1) * dot(glow, vec3(0.33)) * 0.25;
    slide = pow(max(slide, 0.0), vec3(0.95, 1.0, 1.08)) * vec3(1.04, 1.0, 0.94);
    float grain = hash(floor(vUv * size / uPixelRatio) + fract(uTime) * 311.0) - 0.5;
    fragColor = vec4(slide + grain * 0.04, colour.a);
}`,
};

/**
 * A two-drum risograph print: the mid tones in fluorescent pink, the darks in blue a pixel off register,
 * over the map's own colours so it stays legible.
 */
export const risograph: MapEffectsPass = {
    id: 'risograph',
    placement: 'after-depth-of-field',
    uniforms,
    fragment: `uniform float uPixelRatio;
${HASH}
float shade(vec2 uv) { return 1.0 - dot(texture(uSource, uv).rgb, vec3(0.299, 0.587, 0.114)); }
void main() {
    vec2 texel = uPixelRatio / vec2(textureSize(uSource, 0));
    vec4 colour = texture(uSource, vUv);
    float grain = hash(floor(vUv / texel)) - 0.5;
    float pink = smoothstep(0.1, 0.6, shade(vUv) + grain * 0.08);
    float blue = smoothstep(0.45, 0.9, shade(vUv + texel * vec2(1.5, -1.0)) + grain * 0.08);
    vec3 print = vec3(0.97, 0.95, 0.9);
    print *= mix(vec3(1.0), vec3(1.0, 0.45, 0.65), pink * 0.7);
    print *= mix(vec3(1.0), vec3(0.2, 0.35, 0.8), blue * 0.85);
    fragColor = vec4(mix(colour.rgb, print, 0.55), colour.a);
}`,
};

/**
 * A manga page: every edge inked in black, the shadows and the darker walls in a screentone of dots on
 * a 45° grid, growing as the tone darkens, the darkest in solid ink, and the lit faces left white.
 */
export const mangaInk: MapEffectsPass = {
    id: 'manga-ink',
    placement: 'after-depth-of-field',
    uniforms,
    fragment: `uniform float uPixelRatio;
${EDGE}
void main() {
    vec4 colour = texture(uSource, vUv);
    float light = luma(vUv);
    vec2 onScreen = vUv * vec2(textureSize(uSource, 0)) / uPixelRatio;
    vec2 cell = fract(mat2(0.7071, -0.7071, 0.7071, 0.7071) * onScreen / 4.0) - 0.5;
    float tone = clamp((0.92 - light) / 0.8, 0.0, 1.0);
    float radius = sqrt(tone) * 0.48;
    float screen = 1.0 - smoothstep(radius - 0.08, radius + 0.08, length(cell));
    float ink = max(max(screen * step(0.05, tone), smoothstep(0.12, 0.06, light)), smoothstep(0.14, 0.34, edge(vUv)));
    fragColor = vec4(vec3(mix(0.98, 0.06, ink)), colour.a);
}`,
};
