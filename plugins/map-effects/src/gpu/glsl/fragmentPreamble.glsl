#version 300 es
// ⚠️ The directive above has to be the literal first line — ANGLE rejects even a comment before it —
// which is also why it lives here rather than in a stage: a stage is appended to this file, and a
// second directive anywhere is a compile error. ../../tests/effectFilters.test.ts holds that.
//
// Not a program: the preamble ../screenPass.ts prepends to every fragment stage it compiles. It
// carries what is the same for all of them — the source texture, the varying it is read at, the
// colour that is written — so a pass declares only what is its own, and the substrate stays the one
// place those names are spelled.
//
// GLSL ES 3.00, for the two things ES 1.00 cannot give a gather: `textureLod`, without which a tap
// cannot read a prefiltered mip level, and a loop it may leave early.

precision highp float;
precision highp sampler2D;

uniform sampler2D uSource;
in vec2 vUv;
out vec4 fragColor;
