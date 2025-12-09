import { commonSandpackDependencies } from '../../src/constants/sandpackDependencies';
import { SandpackWrapper } from '../../src/sandpack/SandpackWrapper';
import { getSandpackFiles } from '../../src/utils/getSandpackFiles';

export function LdevrDetailedVehicleSandpack() {
    const { layout, files } = getSandpackFiles('ldevr-detailed-vehicle');

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
