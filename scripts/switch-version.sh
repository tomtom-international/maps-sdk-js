#!/bin/bash
#
# Select the latest current package version for an alias out of the local version and versions on the registry

set -e

export NODE_OPTIONS=--max_old_space_size=4096

# Name of branch or tag that was pushed
ref_name=$1;

previousVersion=$(cat package.json | jq -r .version);
echo "Current package.json version is $previousVersion";

# Get all versions of given ref_name from the registry.
all_registry_versions=$(mktemp);
pnpm show @cet/maps-sdk-js versions --json > ${all_registry_versions};

# Select the latest version of given ref_name.
# Note: getting the latest version from all versions instead of the dist-tag prevents issues with
# pushing existing versions when re-creating aliases.
jq_parameter='[.[] | select(test("^\\d+\\.\\d+\\.\\d+-'$ref_name'\\.\\d+$"))] | .[-1] // empty'
latest_registry_version=$(jq -r "$jq_parameter" "$all_registry_versions");
echo "The latest version on the registry for the current alias is $latest_registry_version";

# Select the latest version out of the local version and latest registry version.
pkg_v=$(npx ts-node ./scripts/calculate-latest-version.ts "$previousVersion" "$latest_registry_version")
echo "Current selected pre-release version is $pkg_v";

# Replace local version with resolved one, so the release script could calculate the next version
tmp=$(mktemp);
jq --arg v "$pkg_v" '.version = $v' package.json > "$tmp" && mv "$tmp" package.json
jq --arg v "$pkg_v" '.version = $v' package-lock.json > "$tmp" && mv "$tmp" package-lock.json
