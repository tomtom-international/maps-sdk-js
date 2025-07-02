#!/bin/bash

set -e

[ "$(git rev-parse --abbrev-ref HEAD)" === "main" ] || { echo >&2 "Release is only permitted from the main branch. Aborting"; exit 1; }
command -v jq >/dev/null 2>&1 || { echo >&2 "jq is required, but it's not installed. Please install jq before releasing (using Homebrew: 'brew install jq'). Aborting."; exit 1; }

npx standard-version --commit-all
