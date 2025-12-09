import { commonSandpackDependencies } from '../../src/constants/sandpackDependencies';
import { SandpackWrapper } from '../../src/sandpack/SandpackWrapper';
import { getSandpackFiles } from '../../src/utils/getSandpackFiles';

export function MultipleMapsWithGeometriesSandpack() {
    const { layout, files } = getSandpackFiles('multiple-maps-with-geometries');

    return (
        <SandpackWrapper
            customSetup={{
                dependencies: {
                    ...commonSandpackDependencies,
                    '@turf/turf': '^7.3.1',
                },
            }}
            options={{
                layout,
            }}
            files={files}
        />
    );
}
