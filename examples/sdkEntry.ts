import { createRequire } from 'node:module';
import path from 'node:path';

export type SdkSubpath = 'core' | 'services' | 'map';

export const sdkEntry = (exampleDir: string, subpath: SdkSubpath): string =>
    createRequire(path.join(exampleDir, 'package.json')).resolve(`@tomtom-org/maps-sdk/${subpath}`);

export const sdkMaplibreVersion = (exampleDir: string): string => {
    try {
        return (createRequire(sdkEntry(exampleDir, 'map'))('maplibre-gl/package.json') as { version: string }).version;
    } catch (cause) {
        throw new Error(`The SDK in ${exampleDir} resolves no maplibre-gl. Run pnpm install.`, { cause });
    }
};
