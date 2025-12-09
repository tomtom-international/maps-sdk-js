import { commonSandpackDependencies } from '../../src/constants/sandpackDependencies';
import { SandpackWrapper } from '../../src/sandpack/SandpackWrapper';
import { getSandpackFiles } from '../../src/utils/getSandpackFiles';

export function GeometrySearchWithPoiCategoriesSandpack() {
    const { layout, files } = getSandpackFiles('geometry-search-with-poi-categories');

    return (
        <SandpackWrapper
            customSetup={{
                dependencies: {
                    ...commonSandpackDependencies,
                    '@turf/bbox-polygon': '^7.3.1',
                    '@turf/difference': '^7.3.1',
                },
            }}
            options={{
                layout,
            }}
            files={files}
        />
    );
}
