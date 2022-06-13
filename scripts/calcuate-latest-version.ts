const [, , ...args] = process.argv;
const [localVersion, remoteVersion] = args;

//console.log({alias, localVersion, remoteVersion});

const resolveResult = (result: string) => {
    process.stdout.write(result, "utf-8");
    process.exit();
};

if (!remoteVersion) {
    resolveResult(localVersion);
}

const [l_maj, l_min, l_patch] = (localVersion.match(/(\d+)\.(\d+)\.(\d+)/)?.slice(1, 4) ?? []).map(Number);
const [r_maj, r_min, r_patch] = (remoteVersion.match(/(\d+)\.(\d+)\.(\d+)/)?.slice(1, 4) ?? []).map(Number);

//console.log({l_maj, l_min, l_patch});
//console.log({r_maj, r_min, r_patch});

if (l_maj > r_maj) {
    resolveResult(localVersion);
} else if (l_maj === r_maj && l_min > r_min) {
    resolveResult(localVersion);
} else if (l_min === r_min && l_patch >= r_patch) {
    resolveResult(localVersion);
} else {
    resolveResult(remoteVersion);
}
