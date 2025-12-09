import { commonSandpackDependencies } from '../../src/constants/sandpackDependencies';
import { SandpackWrapper } from '../../src/sandpack/SandpackWrapper';
import { getSandpackFiles } from '../../src/utils/getSandpackFiles';

export function WaypointsSandpack() {
    const { layout, files } = getSandpackFiles('waypoints');

    return (
        <SandpackWrapper
            customSetup={{
                dependencies: commonSandpackDependencies,
            }}
            options={{
                layout,
            }}
            files={files}
        />
    );
}
