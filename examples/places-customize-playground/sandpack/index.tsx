import { commonSandpackDependencies } from '../../src/constants/sandpackDependencies';
import { SandpackWrapper } from '../../src/sandpack/SandpackWrapper';
import { getSandpackFiles } from '../../src/utils/getSandpackFiles';

export function PlacesCustomizePlaygroundSandpack() {
    const { layout, files } = getSandpackFiles('places-customize-playground');

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
