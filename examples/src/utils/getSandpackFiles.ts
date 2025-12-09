import { SandpackFiles } from '@codesandbox/sandpack-react';

type Output = {
    layout?: 'preview' | 'tests' | 'console';
    files: SandpackFiles;
};

const allSourceFiles = import.meta.glob('../../*/src/*', {
    eager: true,
    as: 'raw',
});

export function getSandpackFiles(exampleId: string): Output {
    const sandpackFiles: SandpackFiles = {};
    const hiddenFileNames = ['config.ts'];
    const hiddenFileExtensions = ['.png'];
    const hasHTML = Object.keys(allSourceFiles).some(
        (path) => path.endsWith('.html') && path.includes(`/${exampleId}/`),
    );

    for (let [path, code] of Object.entries(allSourceFiles)) {
        if (path.includes(`/${exampleId}/`)) {
            const fileName = path.split('/').pop() ?? '';
            if (fileName === 'config.ts') {
                code = code.replace('process.env.API_KEY_EXAMPLES', `'${process.env.API_KEY_EXAMPLES}'`);
            }

            sandpackFiles[fileName] = {
                code,
                hidden:
                    hiddenFileNames.includes(fileName) || hiddenFileExtensions.some((ext) => fileName.includes(ext)),
            };
        }
    }
    return {
        layout: hasHTML ? 'preview' : 'console',
        files: sandpackFiles,
    };
}
