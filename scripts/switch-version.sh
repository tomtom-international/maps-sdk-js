#!/bin/bash

set -e

export NODE_OPTIONS=--max_old_space_size=4096

# Get tag name from the first argument
tagName=$1;

# Temporary files
allTmp=$(mktemp);
tmp=$(mktemp);

previousVersion=$(cat package.json | jq -r .version);
echo "Current package.json version is $previousVersion";

npm show @anw/go-sdk-js versions --json > ${allTmp};
#cat "$allTmp"
jqparameter='[.[] | select(test("^\\d+\\.\\d+\\.\\d+-'$tagName'\\.\\d+$"))] | .[-1]'

# Get latest package version for given tag
tag_v=$(npm dist-tag ls @anw/go-sdk-js | sed -n 's/^'"${tagName}"': //p');
repo_v=$(jq -r "$jqparameter" "$allTmp");

echo "tag_v is $tag_v";
echo "repo_v is $repo_v";

pkg_v=$(npx ts-node ./scripts/calculate-latest-version.ts "$previousVersion" "$tag_v" "$repo_v")

# Check current resolved version
echo "Current pre-release version is $pkg_v";

# Replace base version with resolved one, so the release script could calculate the next version
jq --arg v "$pkg_v" '.version = $v' package.json > "$tmp" && mv "$tmp" package.json
jq --arg v "$pkg_v" '.version = $v' package-lock.json > "$tmp" && mv "$tmp" package-lock.json
