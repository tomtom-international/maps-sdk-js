#version 300 es
// ⚠️ The directive above has to be the literal first line — ANGLE rejects even a comment before it,
// and the whole program then fails to compile.
//
// The vertex half of every pass the substrate runs — see ../screenPass.ts, which loads this file
// with Vite's `?raw`.
//
// It belongs to the substrate rather than to any one pass, because what it interprets is the
// substrate's own geometry: a single full-screen triangle. One primitive rather than a quad's two,
// so no diagonal seam is rasterised twice, and the corners fall out of `gl_VertexID` so there is no
// buffer to bind.
//
// ⚠️ `vUv` runs with v increasing upward, matching the flipped upload in `uploadSource` — so v = 0
// is the bottom of the frame, which on a tilted map is the nearest ground. The depth of field
// depends on that, so it is a contract rather than an accident.

out vec2 vUv;

void main() {
    vec2 corner = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    vUv = corner;
    gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}
