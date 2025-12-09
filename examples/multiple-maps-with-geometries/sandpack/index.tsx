import { SandpackWrapper } from '../../src/sandpack/SandpackWrapper';
import { getSandpackDependencies, getSandpackFiles } from '../../src/utils/sandpackUtils';

export default function MultipleMapsWithGeometriesSandpack() {
    const { layout, files } = getSandpackFiles();

    return (
        <SandpackWrapper
            customSetup={{
                dependencies: getSandpackDependencies(),
            }}
            options={{
                layout,
            }}
            files={files}
        />
    );
}
