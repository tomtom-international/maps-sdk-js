#!/usr/bin/env bash
# Prints the Playwright image the e2e lanes run in, the one matching the @playwright/test version in
# pnpm-workspace.yaml. CI's resolve-playwright-image action and e2e-in-container.sh both read it here:
# Firefox's and WebKit's baselines hold in that image only.
set -euo pipefail

repo=$(cd "$(dirname "$0")/../../.." && pwd)
version=$(grep '@playwright/test' "$repo/pnpm-workspace.yaml" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || true)
if [[ -z "$version" ]]; then
    echo "Could not resolve @playwright/test version from pnpm-workspace.yaml" >&2
    exit 1
fi
echo "mcr.microsoft.com/playwright:v${version}-noble"
