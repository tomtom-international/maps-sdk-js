const [, , ...args] = process.argv;
const [localVersion, remoteVersion, repoVersion] = args;
const versionRegex = /^(\d+)\.(\d+)\.(\d+)([a-z0-9-.]){0,100}$/gi;

const resolveResult = (result: string) => {
    process.stdout.write(result, "utf-8");
    process.exit();
};

let version = "";

if (!remoteVersion) {
    // new alias or re-creation of the old one
    version = localVersion;
} else {
    const [l_maj, l_min, l_patch] = (localVersion.match(versionRegex)?.slice(1, 4) ?? []).map(Number);
    const [r_maj, r_min, r_patch] = (remoteVersion.match(versionRegex)?.slice(1, 4) ?? []).map(Number);

    if (l_maj > r_maj || l_maj === r_maj && l_min > r_min || l_min === r_min && l_patch >= r_patch) {
        version = localVersion;
    } else {
        version = remoteVersion;
    }
}

const [candidate_maj, candidate_min, candidate_patch] = (version.match(versionRegex)?.slice(1, 4) ?? []).map(Number);
const [repo_maj, repo_min, repo_patch] = (repoVersion.match(versionRegex)?.slice(1, 4) ?? []).map(Number);

if (repo_maj === candidate_maj && repo_min === candidate_min && repo_patch === candidate_patch + 1) {
    // take the latest repo version. "1.2.3-my-old-version.4"
    version = repoVersion;
}

resolveResult(version);
