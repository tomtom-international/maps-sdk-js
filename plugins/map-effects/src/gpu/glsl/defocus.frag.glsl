// The depth-of-field pass: the circle of confusion a tilted camera implies at each row of the
// picture, and the aperture gathered over it. See ../defocusShader.ts, which loads this file and
// names the uniforms below, and `defocusUniforms` in ../../effectFilters.ts, which works out the
// optics this only applies.
//
// The declarations the substrate already made — `uSource`, `vUv`, `fragColor`, the precisions and
// the version directive — are in ./fragmentPreamble.glsl and must not be repeated here.

// What each of these means is on `DefocusUniforms` in ../defocusShader.ts, which is also where the
// spelling is held to match.
uniform float uDepth;
uniform float uFocus;
uniform float uBand;
uniform float uBlur;
uniform float uBokeh;
uniform vec2 uTexel;

// A tap budget rather than a tap count: the loop is bounded by a constant so a wide disc stays
// affordable, and filled to `taps` so a narrow one stays smooth.
const int MAX_TAPS = 48;
// The golden angle: successive taps land as far from every previous one as a turn can put them, so
// a partly filled disc is still an even disc.
const float GOLDEN_ANGLE = 2.39996323;

// Where a row falls on the depth scale: 0 at the nearest ground, 1 at the horizon. Linear in the
// row because reciprocal distance across a plane really is affine in screen space.
float depthAt(float v) {
    return uDepth * v;
}

/**
 * The circle of confusion at a row, in device pixels. Proportional to the distance from the plane
 * of focus in reciprocal units, which is what a thin lens does. The sharp band is taken out of the
 * ramp and the remainder stretched back over the full range, so widening the field moves where the
 * blur starts without also weakening how far it goes.
 */
float circleOfConfusion(float v) {
    float defocus = abs(depthAt(v) - uFocus) - uBand;
    return uBlur * clamp(defocus / max(1.0 - uBand, 0.001), 0.0, 1.0);
}

// Rec. 709 luma.
float luma(vec3 colour) {
    return dot(colour, vec3(0.2126, 0.7152, 0.0722));
}

/**
 * What makes it a bokeh rather than a blur: a lens does not average the light it cannot resolve, it
 * spreads it, so every point arrives as an image of the aperture at its own brightness. Weighting a
 * sample by the fourth power of its brightness keeps a highlight's value across the whole disc it
 * is spread over — at half brightness the extra weight is a sixteenth, so ordinary map colour still
 * averages as it should. Deliberately not energy-conserving: normalising that away leaves a blur.
 */
float bokehWeight(vec3 colour) {
    float bright = luma(colour);
    float fourth = bright * bright * bright * bright;
    return 1.0 + uBokeh * 8.0 * fourth;
}

// Per-pixel and stable, so a still picture is still: the angle the disc below is spun by.
float hash(vec2 at) {
    vec3 spread = fract(vec3(at.xyx) * 0.1031);
    spread += dot(spread, spread.yzx + 33.33);
    return fract((spread.x + spread.y) * spread.z);
}

/**
 * The aperture, gathered: a disc of `coc` diameter, weighted so the highlights survive it.
 *
 * Two dozen taps across a wide disc is a scatter of ghosts rather than a blur, and the fix is not
 * more taps but bigger ones — each is read from the mip level whose texels are about as wide as the
 * gaps between them, so what is sampled is already the average of what was skipped. The two numbers
 * are tied to each other rather than tuned apart, which is what keeps a wide disc the same picture
 * as a narrow one instead of a coarser one.
 */
vec4 defocus(vec2 uv, float coc) {
    float radius = coc * 0.5;
    // Inside a texel there is nothing to gather, and the sharp band all comes through here — it has
    // to hand back the source unchanged.
    if (radius < 0.75) return textureLod(uSource, uv, 0.0);

    int taps = int(clamp(radius * 1.5, 12.0, float(MAX_TAPS)));
    float spacing = radius * sqrt(3.14159265 / float(taps));
    float level = max(log2(spacing), 0.0);
    // Without the spin every pixel samples the same directions and the residual undersampling lines
    // up into streaks; broken up, what is left reads as grain.
    float spin = hash(gl_FragCoord.xy) * 6.28318531;

    vec4 centre = textureLod(uSource, uv, level);
    float weight = bokehWeight(centre.rgb);
    vec4 total = vec4(centre.rgb * centre.a, centre.a) * weight;
    float carried = weight;

    for (int index = 0; index < MAX_TAPS; index++) {
        if (index >= taps) break;

        // The square root of the fraction, not the fraction: a disc's area grows with the square of
        // its radius, so evenly spaced radii would crowd every tap into the middle.
        float fraction = (float(index) + 0.5) / float(taps);
        float distance = radius * sqrt(fraction);
        float angle = float(index) * GOLDEN_ANGLE + spin;
        vec2 offset = vec2(cos(angle), sin(angle)) * distance;

        vec4 sampled = textureLod(uSource, uv + offset * uTexel, level);
        float tapWeight = bokehWeight(sampled.rgb);
        total += vec4(sampled.rgb * sampled.a, sampled.a) * tapWeight;
        carried += tapWeight;
    }

    // Colour comes back out of the premultiplied sum by its own alpha, the alpha by the weight.
    return vec4(total.rgb / max(total.a, 0.0001), total.a / carried);
}

void main() {
    // The texture is uploaded flipped, so this row runs from the bottom of the frame — the nearest
    // ground — which is the direction the depth ramp is measured in.
    fragColor = defocus(vUv, circleOfConfusion(vUv.y));
}
