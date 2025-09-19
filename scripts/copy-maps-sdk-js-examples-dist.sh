#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define paths
EXAMPLES_DIR="./examples"
DEST_DIR="./examples-dist/dist"

# Create destination directory if it doesn't exist
mkdir -p "$DEST_DIR"

# Loop through each subdirectory in examples/
for module_path in "$EXAMPLES_DIR"/*; do
  if [ -d "$module_path" ]; then
    module_name=$(basename "$module_path")
    index_html="$module_path/dist/index.html"
    target_html="$DEST_DIR/${module_name}.html"

    if [ -f "$index_html" ]; then
      cp "$index_html" "$target_html"
      echo "✅ Copied $index_html → $target_html"
    else
      echo "⚠️  Skipped $module_name: dist/index.html not found."
    fi
  fi
done

echo "✅ All done."
