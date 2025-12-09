import { commonSandpackDependencies } from '../../src/constants/sandpackDependencies';
import { SandpackWrapper } from '../../src/sandpack/SandpackWrapper';
import { getSandpackFiles } from '../../src/utils/getSandpackFiles';

export function NodejsRevGeoSandpack() {
    const { layout, files } = getSandpackFiles('nodejs-rev-geo');

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
