import { commonSandpackDependencies } from '../../src/constants/sandpackDependencies';
import { SandpackWrapper } from '../../src/sandpack/SandpackWrapper';
import { getSandpackFiles } from '../../src/utils/getSandpackFiles';

export function EvChargingStationsPlaygroundSandpack() {
    const { layout, files } = getSandpackFiles('ev-charging-stations-playground');

    return (
        <SandpackWrapper
            customSetup={{
                dependencies: {
                    ...commonSandpackDependencies,
                    '@turf/turf': '^7.3.1',
                    'lodash-es': '4.17.21',
                },
            }}
            options={{
                layout,
            }}
            files={files}
        />
    );
}
