#!/bin/bash

set -e

# Write global frontmatter to typedoc configuration file
npx ts-node ./scripts/documentation/write-global-frontmatter-to-typedoc.ts

# Build our custom typedoc plugin
rimraf ./documentation/maps-sdk-theme/dist && tsc -p ./documentation/maps-sdk-theme

# Generate API reference
typedoc

# Generate navigation.yml file based on typedoc output
npx ts-node scripts/documentation/generate-docs-nav-file.ts
