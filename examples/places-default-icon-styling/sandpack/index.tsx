import { commonSandpackDependencies } from '../../src/constants/sandpackDependencies';
import { SandpackWrapper } from '../../src/sandpack/SandpackWrapper';
import { getSandpackFiles } from '../../src/utils/getSandpackFiles';

export function PlacesDefaultIconStylingSandpack() {
    const { layout, files } = getSandpackFiles('places-default-icon-styling');

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
