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
    process.stdout.write(result, 'utf-8');
    process.exit();
};

let version = '';

if (!remoteVersion) {
    // new alias or re-creation of the old one
    version = localVersion;
} else {
    const [lMaj, lMin, lPatch] = getVersionNumbers(localVersion);
    const [rMaj, rMin, rPatch] = getVersionNumbers(remoteVersion);

    if (lMaj > rMaj || (lMaj === rMaj && lMin > rMin) || (lMaj === rMaj && lMin === rMin && lPatch >= rPatch)) {
        version = localVersion;
    } else {
        version = remoteVersion;
    }
}

resolveResult(version);
