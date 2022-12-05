const { readdir, appendFile } = require('fs/promises');
const { join } = require('path')
const directory = 'documentation/dev-portal/web/maps/documentation'
const hiddenEntries = ["classes", "functions", "interfaces", "types", "variables"]

//@ts-ignore
// fs.promises.readdir(directory, (err, files) => {
//     console.log(files);
//     console.log(resolve('wwwroot', 'static_files/png/', 'gif/image.gif'));
// })


async function getFiles(basePath: string, currDir: string) {
    const dirents = await readdir(join(basePath, currDir), { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent: any) => {
        const res = join(currDir, dirent.name);
        return dirent.isDirectory() ? getFiles(basePath, res) : `      - fileId: ${res.slice(0, -3)}\n        isHidden: true`;
    }));
    return Array.prototype.concat(...files);
}

getFiles(directory,'api-reference').then((res) => res.join('\n')).then((res) => appendFile(join(directory, 'navigation.yml'), res )).then(console.log)


// console.log(join('', "aa/vv"))
