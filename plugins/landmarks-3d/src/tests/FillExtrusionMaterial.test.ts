import { DoubleSide, FrontSide, Texture, type Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { FillExtrusionDepthMaterial, FillExtrusionMaterial } from '../FillExtrusionMaterial';

describe('FillExtrusionMaterial', () => {
    it('culls backfaces and shares the depth-prepass vertex shader when given no alpha mask', () => {
        const material = new FillExtrusionMaterial();

        expect(material.side).toBe(FrontSide);
        expect(material.defines ?? {}).not.toHaveProperty('USE_ALPHA_MASK');
        // The depth prepass shares the vertex shader so both passes emit identical depth.
        expect(new FillExtrusionDepthMaterial().vertexShader).toBe(material.vertexShader);
    });

    it('shades on the raw sRGB paint colour with a bearing-rotated light, like the maplibre painter', () => {
        const material = new FillExtrusionMaterial();

        material.setDiffuseColor('hsl(210, 9%, 22%)');
        const diffuse = material.uniforms.diffuseColor.value as Vector3;
        expect(diffuse.x).toBeCloseTo(0.2, 2);
        expect(diffuse.y).toBeCloseTo(0.22, 2);
        expect(diffuse.z).toBeCloseTo(0.24, 2);

        material.setLight({ x: 1, y: 0, z: 0.5 }, Math.PI / 2, 0.4, { r: 1, g: 0.5, b: 0 });
        const lightPosition = material.uniforms.lightPosition.value as Vector3;
        expect(lightPosition.x).toBeCloseTo(0, 6);
        expect(lightPosition.y).toBeCloseTo(1, 6);
        expect(lightPosition.z).toBeCloseTo(0.5, 6);
        expect(material.uniforms.lightIntensity.value).toBe(0.4);
        expect((material.uniforms.lightColor.value as Vector3).toArray()).toEqual([1, 0.5, 0]);
    });

    it('carries a texture alpha cutout into both the colour and depth passes, and copies live shading onto it', () => {
        const map = new Texture();
        const alphaMask = { map, cutoff: 0.1 };

        for (const masked of [new FillExtrusionMaterial(alphaMask), new FillExtrusionDepthMaterial(alphaMask)]) {
            expect(masked.defines).toHaveProperty('USE_ALPHA_MASK');
            expect(masked.uniforms.alphaMask.value).toBe(map);
            expect(masked.uniforms.alphaMaskCutoff.value).toBe(0.1);
            expect(masked.side).toBe(DoubleSide);
        }

        const source = new FillExtrusionMaterial();
        source.setDiffuseColor('#336699');
        source.setLight({ x: 1, y: 2, z: 3 }, 0, 0.8, { r: 0.1, g: 0.2, b: 0.3 });
        source.setLayerOpacity(0.7);

        const variant = new FillExtrusionMaterial(alphaMask);
        variant.copyShadingFrom(source);
        expect((variant.uniforms.diffuseColor.value as Vector3).toArray()).toEqual(
            (source.uniforms.diffuseColor.value as Vector3).toArray(),
        );
        expect((variant.uniforms.lightPosition.value as Vector3).toArray()).toEqual([1, 2, 3]);
        expect(variant.uniforms.lightIntensity.value).toBe(0.8);
        expect(variant.uniforms.layerOpacity.value).toBe(0.7);
    });
});
