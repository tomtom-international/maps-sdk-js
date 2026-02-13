#!/bin/bash

# Generates optimized thumbnail images for examples from their e2e test snapshots.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXAMPLES_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

THUMBNAIL_WIDTH=1000
THUMBNAIL_HEIGHT=500

generate_thumbnail() {
  local example="$1"
  local snapshot="$EXAMPLES_DIR/$example/e2e-tests/snapshots/upon-load.png"
  local content_dir="$EXAMPLES_DIR/$example/content"
  local thumbnail="$content_dir/thumbnail.png"

  if [ ! -f "$snapshot" ]; then
    echo "  Skipping \"$example\" — no snapshot found"
    return 1
  fi

  mkdir -p "$content_dir"

  node --input-type=module -e "
    import sharp from 'sharp';
    await sharp('$snapshot')
      .resize($THUMBNAIL_WIDTH, $THUMBNAIL_HEIGHT)
      .png({ palette: true, quality: 80, effort: 10 })
      .toFile('$thumbnail');
  "

  echo "  Generated thumbnail for \"$example\""
}

if [ $# -gt 0 ]; then
  example="$1"
  if [ ! -d "$EXAMPLES_DIR/$example" ]; then
    echo "Example \"$example\" not found."
    exit 1
  fi
  echo "Generating thumbnail for \"$example\"..."
  generate_thumbnail "$example"
else
  count=0
  examples=()
  for dir in "$EXAMPLES_DIR"/*/; do
    name="$(basename "$dir")"
    case "$name" in
      node_modules|dist|scripts|src) continue ;;
    esac
    examples+=("$name")
  done

  echo "Generating thumbnails for ${#examples[@]} examples..."
  for example in "${examples[@]}"; do
    if generate_thumbnail "$example"; then
      ((count++))
    fi
  done
  echo "Done — $count thumbnails generated."
fi
