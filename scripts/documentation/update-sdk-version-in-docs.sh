#!/bin/bash

set -e

VERSION=$(jq -r '.version' ./package.json)

### Update typedoc.json frontmatter with new version label
tmp=$(mktemp)
jq "(.frontmatterGlobals.titleTags[] | select(.label | contains(\"VERSION\")) | .label) = \"VERSION $VERSION\"" ./typedoc.json > "$tmp" && mv "$tmp" ./typedoc.json
echo "Updated typedoc.json frontmatter version label to VERSION $VERSION"

### Update SDK version in static documentation (guides and overview)
SED_EXPRESSION="s/- label: \"VERSION [0-9]+\.[0-9]+\.[0-9]+\"/- label: \"VERSION $VERSION\"/"
TARGET_FILES="./documentation/dev-portal/javascript/maps/documentation/overview ./documentation/dev-portal/javascript/maps/documentation/guides"

# -i flag differs between sed for MacOS and Linux
# Loop over all static docs (overview + guides) and replace the version label with the new version label
if [[ "$OSTYPE" === "darwin"* ]]; then
  find $TARGET_FILES -type f -name "*.mdx" -exec sed -r -i '' "$SED_EXPRESSION" {} +
else
  find $TARGET_FILES -type f -name "*.mdx" -exec sed -r -i "$SED_EXPRESSION" {} +
fi

echo "Updated guide version labels to VERSION $VERSION"
