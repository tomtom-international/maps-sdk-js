#!/bin/bash
#
# Select the latest current package version for the current branch

set -e

export NODE_OPTIONS=--max_old_space_size=4096

# Name of branch or tag that was pushed
ref_name=$1;

# Get all versions of given ref_name from the registry.
all_registry_versions=$(mktemp);
npm show @cet/maps-sdk-js versions --json > ${all_registry_versions};

# Select the latest version of given ref_name.
# Note: getting the latest version from all versions instead of the dist-tag prevents issues with
# pushing existing versions when re-creating aliases.
jq_parameter='[.[] | select(test("^\\d+\\.\\d+\\.\\d+-'$ref_name'\\.\\d+$"))] | .[-1] // empty'
latest_registry_version=$(jq -r "$jq_parameter" "$all_registry_versions");
echo "The latest version on the registry for the current alias is $latest_registry_version";

echo "BRANCH_VERSION=$latest_registry_version" >> $GITHUB_ENV
