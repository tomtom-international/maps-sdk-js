import { commonSandpackDependencies } from '../../src/constants/sandpackDependencies';
import { SandpackWrapper } from '../../src/sandpack/SandpackWrapper';
import { getSandpackFiles } from '../../src/utils/getSandpackFiles';

export function RouteGeometrySearchesSandpack() {
    const { layout, files } = getSandpackFiles('route-geometry-searches');

    return (
        <SandpackWrapper
            customSetup={{
                dependencies: {
                    ...commonSandpackDependencies,
                    '@turf/buffer': '^7.3.1',
                },
            }}
            options={{
                layout,
            }}
            files={files}
        />
    );
}
