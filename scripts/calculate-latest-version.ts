const [, , ...args] = process.argv;
const [localVersion, remoteVersion] = args;

/* 
 Given a version "1.2.3-ALIAS_NAME.0":
 a match call returns ["1.2.3-ALIAS_NAME.0", "1", "2", "3", ...]
 */
const versionRegex = /^(\d+)\.(\d+)\.(\d+)/;

const getVersionNumbers = (version: string) => {
    return (version.match(versionRegex)?.slice(1, 4) ?? []).map(Number);
};

const resolveResult = (result: string) => {
    process.stdout.write(result, "utf-8");
    process.exit();
};

let version = "";

if (!remoteVersion) {
    // new alias or re-creation of the old one
    version = localVersion;
} else {
    const [l_maj, l_min, l_patch] = getVersionNumbers(localVersion);
    const [r_maj, r_min, r_patch] = getVersionNumbers(remoteVersion);

    if (
        l_maj > r_maj ||
        (l_maj === r_maj && l_min > r_min) ||
        (l_maj === r_maj && l_min === r_min && l_patch >= r_patch)
    ) {
        version = localVersion;
    } else {
        version = remoteVersion;
    }
}

resolveResult(version);
