/**
 * A watercolour fragment shader for `MapEffects.addPass`, repainting the map's own pixels: small washes,
 * paint wandering off the lines, pigment pooled where the colour breaks, and the paper's grain.
 *
 * Lengths are CSS pixels scaled by `uScale` (the device pixel ratio), sized for a thin brush.
 */
export const WATERCOLOR_FRAGMENT = `
uniform float uScale;

const float STRENGTH = 1.0;       // how much of the paint replaces the map: lower it to let the map show through
const float PATCH = 0.8;          // radius of one wash, never under one device pixel
const float WANDER = 0.6;         // how far the paint strays from the line
const float WANDER_PITCH = 10.0;  // over what wavelength it strays
const float BLEED = 0.5;          // how far colour creeps past its wash
const float EDGE = 0.65;          // pigment pooled at colour breaks, as a share of the colour
const float EDGE_SPAN = 0.5;      // where the edges are read, next to the edge itself
const float GRAIN = 0.28;         // the paper's tooth
const float GRAIN_PITCH = 2.4;

// An integer hash, so the paper is the same on every GPU.
float hash(vec2 cell) {
    uvec2 bits = uvec2(ivec2(floor(cell)) + 4096);
    uint h = bits.x * 0x27d4eb2du + bits.y * 0x165667b1u;
    h ^= h >> 15;
    h *= 0x2545f491u;
    h ^= h >> 13;
    return float(h >> 8) / 16777216.0;
}

float valueNoise(vec2 point) {
    vec2 cell = floor(point);
    vec2 offset = smoothstep(0.0, 1.0, point - cell);
    return mix(
        mix(hash(cell), hash(cell + vec2(1.0, 0.0)), offset.x),
        mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), offset.x),
        offset.y
    );
}

float fbm(vec2 point) {
    return valueNoise(point) * 0.55 + valueNoise(point * 2.07 + 19.3) * 0.3 + valueNoise(point * 4.13 + 71.7) * 0.15;
}

float luma(vec3 colour) {
    return dot(colour, vec3(0.2126, 0.7152, 0.0722));
}

// Kuwahara: the flattest of the four quadrants around a point wins, which is what turns a gradient
// into washes with borders.
vec3 washes(vec2 uv, vec2 texel, float radius) {
    int reach = max(1, int(radius));
    vec3 best = vec3(0.0);
    float bestSpread = 1e9;
    for (int quadrant = 0; quadrant < 4; quadrant++) {
        vec2 corner = vec2(quadrant == 0 || quadrant == 2 ? -1.0 : 1.0, quadrant < 2 ? -1.0 : 1.0);
        vec3 total = vec3(0.0);
        vec3 squares = vec3(0.0);
        float count = 0.0;
        for (int across = 0; across <= reach; across++) {
            for (int down = 0; down <= reach; down++) {
                vec3 tap = texture(uSource, uv + corner * vec2(float(across), float(down)) * texel).rgb;
                total += tap;
                squares += tap * tap;
                count += 1.0;
            }
        }
        vec3 mean = total / count;
        vec3 spread = abs(squares / count - mean * mean);
        float flatness = spread.r + spread.g + spread.b;
        if (flatness < bestSpread) {
            bestSpread = flatness;
            best = mean;
        }
    }
    return best;
}

// Sixteen taps in eight directions at two radii, so colour spreads rather than ghosting a line
// onto either side of itself.
vec3 bleed(vec2 uv, vec2 texel, float span) {
    vec3 total = vec3(0.0);
    for (int direction = 0; direction < 8; direction++) {
        float angle = float(direction) * 0.7853982;
        vec2 offset = vec2(cos(angle), sin(angle)) * texel * span;
        total += texture(uSource, uv + offset).rgb + texture(uSource, uv + offset * 0.5).rgb;
    }
    return total / 16.0;
}

void main() {
    vec2 texel = 1.0 / vec2(textureSize(uSource, 0));
    vec2 cssPoint = gl_FragCoord.xy / uScale;

    vec2 wander = (vec2(fbm(cssPoint / WANDER_PITCH), fbm(cssPoint / WANDER_PITCH + 53.7)) - 0.5) * 2.0;
    vec2 uv = clamp(vUv + wander * WANDER * uScale * texel, 0.0, 1.0);

    vec3 paint = washes(uv, texel, PATCH * uScale);
    paint = mix(paint, bleed(uv, texel, BLEED * uScale), 0.35);

    vec2 span = texel * max(EDGE_SPAN * uScale, 1.0);
    vec2 slope = vec2(
        luma(texture(uSource, uv + vec2(span.x, 0.0)).rgb) - luma(texture(uSource, uv - vec2(span.x, 0.0)).rgb),
        luma(texture(uSource, uv + vec2(0.0, span.y)).rgb) - luma(texture(uSource, uv - vec2(0.0, span.y)).rgb)
    );
    paint *= 1.0 - EDGE * clamp(length(slope) * 3.0, 0.0, 1.0);

    // Pigment settles in the tooth, so the darker the paint the more of the paper shows through.
    float tooth = fbm(cssPoint / GRAIN_PITCH) - 0.5;
    paint *= 1.0 + GRAIN * tooth * (1.35 - luma(paint));

    vec4 source = texture(uSource, vUv);
    fragColor = vec4(mix(source.rgb, clamp(paint, 0.0, 1.0), STRENGTH), source.a);
}
`;
