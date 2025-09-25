#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Get root version
ROOT_VERSION=$(node -p "require('./package.json').version")

# Set path to subfolder package
SUBFOLDER="./examples"

# Update version in subfolder package.json
jq --arg version "$ROOT_VERSION" '.version = $version' "$SUBFOLDER/package.json" > "$SUBFOLDER/package.tmp.json" && \
mv "$SUBFOLDER/package.tmp.json" "$SUBFOLDER/package.json"