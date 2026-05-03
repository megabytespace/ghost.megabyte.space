#!/usr/bin/env bash
set -euo pipefail

# Usage: extract-favicon-set.sh <source-logo.png>
# Generates the full favicon + app-icon set from a square master logo.

SRC="${1:-}"
if [ -z "$SRC" ] || [ ! -f "$SRC" ]; then
  echo "Usage: $0 <source-logo.png>"
  exit 1
fi

PUBLIC_DIR="$(cd "$(dirname "$0")/.." && pwd)/public"
TMP_MASTER="/tmp/claude/master-logo.png"
mkdir -p "$(dirname "$TMP_MASTER")"

# Step 1: ensure square master at 1024 (auto-trim transparent borders if any, then center on 1024 with safe padding)
# Use ImageMagick 7.
magick "$SRC" -strip -resize "1024x1024^" -gravity center -extent 1024x1024 "$TMP_MASTER"

echo "→ Master logo prepared: $TMP_MASTER"

# Step 2: generate the full favicon set
# Standard PWA + Apple set per always.md
magick "$TMP_MASTER" -resize 16x16   "$PUBLIC_DIR/favicon-16x16.png"
magick "$TMP_MASTER" -resize 32x32   "$PUBLIC_DIR/favicon-32x32.png"
magick "$TMP_MASTER" -resize 180x180 "$PUBLIC_DIR/apple-touch-icon.png"
magick "$TMP_MASTER" -resize 192x192 "$PUBLIC_DIR/android-chrome-192x192.png"
magick "$TMP_MASTER" -resize 512x512 "$PUBLIC_DIR/android-chrome-512x512.png"

# Multi-resolution ICO (16/32/48)
magick "$TMP_MASTER" \
  \( -clone 0 -resize 16x16 \) \
  \( -clone 0 -resize 32x32 \) \
  \( -clone 0 -resize 48x48 \) \
  -delete 0 "$PUBLIC_DIR/favicon.ico"

# Maskable variant: add 10% safe-zone padding
magick "$TMP_MASTER" -resize 819x819 -background "#060610" -gravity center -extent 1024x1024 "$PUBLIC_DIR/maskable-icon-512.png"
magick "$PUBLIC_DIR/maskable-icon-512.png" -resize 512x512 "$PUBLIC_DIR/maskable-icon-512.png"

# Navbar logo: 256px transparent PNG (will be styled to fit)
magick "$TMP_MASTER" -resize 256x256 "$PUBLIC_DIR/logo-nav.png"

# Master + lockup variants
cp "$TMP_MASTER" "$PUBLIC_DIR/logo-master.png"

echo "✓ Favicon set generated."
ls -la "$PUBLIC_DIR/favicon.ico" "$PUBLIC_DIR/favicon-"*.png "$PUBLIC_DIR/apple-touch-icon.png" "$PUBLIC_DIR/android-chrome-"*.png "$PUBLIC_DIR/maskable-icon-512.png" "$PUBLIC_DIR/logo-nav.png" "$PUBLIC_DIR/logo-master.png"
