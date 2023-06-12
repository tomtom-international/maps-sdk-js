#!/bin/bash

set -e

# Build our custom typedoc plugin
rimraf ./documentation/maps-sdk-theme/dist && tsc --strict -p ./documentation/maps-sdk-theme

# Generate API reference
typedoc

# Generate navigation.yml file based on typedoc output
npx ts-node scripts/documentation/generate-docs-nav-file.ts
