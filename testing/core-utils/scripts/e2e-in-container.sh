#!/usr/bin/env bash
# Runs a command in the Playwright image the e2e lanes run in, on a copy of this working tree, and copies
# back every baseline it wrote. Firefox's and WebKit's baselines are captures of that image (see
# `TAG_CROSS_BROWSER_VISUAL` in src/browser-projects.ts), and on Windows it is how the suites run at all.
#
#   pnpm e2e-test:in-container pnpm e2e-test:map-effects -- --project firefox --project webkit --update-snapshots
#
# The CI runners are arm64, so the image is too; set E2E_CONTAINER_PLATFORM to run another (an emulated
# arm64 is slow on an x86-64 host, and its baselines are the only ones CI will match).
set -euo pipefail

if [[ "$#" -eq 0 ]]; then
    echo "Usage: pnpm e2e-test:in-container <command…>" >&2
    exit 2
fi

repo=$(git rev-parse --show-toplevel)
image=$(bash "$repo/testing/core-utils/scripts/playwright-image.sh")
platform=${E2E_CONTAINER_PLATFORM:-linux/arm64}

# The tracked and untracked files, without what .gitignore keeps out: node_modules and builds are the
# host's, and the container makes its own. macOS' tar would add each file's extended attributes, and
# a `._` file beside it that the test runners would read as a spec.
copy_working_tree() {
    git -C "$repo" ls-files --cached --others --exclude-standard -z |
        while IFS= read -r -d '' file; do if [[ -e "$repo/$file" ]]; then printf '%s\0' "$file"; fi; done |
        COPYFILE_DISABLE=1 tar -C "$repo" --no-xattrs --null -T - -cf -
}

# CI is set as in the lanes: the configs read it for headed Firefox, retries and the cross-browser
# visual tests. The keys come from the env files the configs would read outside CI, which the copy leaves
# out as .gitignore does. The pnpm store
# outlives the container, in a volume of its own, so a second run downloads nothing.
copy_working_tree | docker run --rm -i --platform "$platform" \
    --volume "$repo:/repo" \
    --volume "maps-sdk-js-e2e-pnpm-store-${platform//\//-}:/pnpm-store" \
    --env CI=1 --env COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    "$image" bash -c '
        set -euo pipefail
        mkdir /work && tar -xf - -C /work && cd /work
        set -a
        for envFile in /repo/shared-configs/.env /repo/examples/.env; do [ -f "$envFile" ] && . "$envFile"; done
        set +a
        corepack enable
        pnpm install --frozen-lockfile --strict-peer-dependencies --ignore-scripts --store-dir /pnpm-store
        touch /tmp/started
        status=0
        xvfb-run -a "$@" || status=$?
        find . -name node_modules -prune -o -path "*/snapshots/*.png" -newer /tmp/started -print |
            tar -cf - -T - | tar -xf - -C /repo
        exit "$status"
    ' e2e-in-container "$@"
