#!/bin/bash

set -e

VERSION=$(jq -r '.version' ./package.json)

# Update typedoc.json frontmatter with new version label
tmp=$(mktemp)
jq "(.frontmatterGlobals.titleTags[] | select(.label | contains(\"VERSION\")) | .label) = \"VERSION $VERSION\"" ./typedoc.json > "$tmp" && mv "$tmp" ./typedoc.json
echo "Updated typedoc.json frontmatter version label to VERSION $VERSION"

# Update SDK version in static documentation (guides and overview)
find ./documentation/dev-portal/javascript/maps/documentation/overview ./documentation/dev-portal/javascript/maps/documentation/guides \
 -type f -name "*.mdx" -exec sed -r -i '' "s/- label: \"VERSION [0-9]+\.[0-9]+\.[0-9]+\"/- label: \"VERSION $VERSION\"/" {} \;
echo "Updated guide version labels to VERSION $VERSION"
