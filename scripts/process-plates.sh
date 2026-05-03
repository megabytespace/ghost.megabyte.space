#!/usr/bin/env bash
set -uo pipefail

SRC="$HOME/Snapchat/license-plates"
OUT="/Users/apple/emdash-projects/worktrees/puny-chairs-create-9eu/public/plates-all"
MANIFEST="$OUT/_manifest.tsv"
LOG="$OUT/_errors.log"

mkdir -p "$OUT"
: > "$MANIFEST"
: > "$LOG"

processImage() {
  local file="$1"
  local base name date desc hash slug target
  base="${file##*/}"
  name="${base%.*}"
  date="${name%%__*}"
  local rest="${name#*__}"
  hash="${rest##*__}"
  desc="${rest%__*}"
  desc="${desc#chat__}"
  slug="${desc//_/-}"
  target="${date}-${slug}-${hash:0:8}.webp"
  if [[ ! -s "$OUT/$target" ]]; then
    if ! magick "$file" -auto-orient -resize "720x720^" -gravity center -extent 720x720 -quality 82 "$OUT/$target" 2>>"$LOG"; then
      echo "IMAGE FAIL: $file" >> "$LOG"
      rm -f "$OUT/$target"
      return 0
    fi
  fi
  printf '%s\timage\t%s\t%s\t%s\n' "$target" "$date" "$desc" "$hash" >> "$MANIFEST"
}

processVideo() {
  local file="$1"
  local base name date desc hash slug target poster tmpjpg
  base="${file##*/}"
  name="${base%.*}"
  date="${name%%__*}"
  local rest="${name#*__}"
  hash="${rest##*__}"
  desc="${rest%__*}"
  desc="${desc#chat__}"
  slug="${desc//_/-}"
  target="${date}-${slug}-${hash:0:8}.mp4"
  poster="${date}-${slug}-${hash:0:8}-poster.webp"
  if [[ ! -s "$OUT/$target" ]]; then
    if ! ffmpeg -y -loglevel error -i "$file" \
      -vf "crop='min(iw,ih)':'min(iw,ih)':'(iw-min(iw,ih))/2':'(ih-min(iw,ih))/2',scale=480:480" \
      -an -c:v libx264 -preset fast -crf 28 -movflags +faststart \
      "$OUT/$target" 2>>"$LOG"; then
      echo "VIDEO FAIL: $file" >> "$LOG"
      rm -f "$OUT/$target"
      return 0
    fi
  fi
  if [[ ! -s "$OUT/$poster" ]]; then
    tmpjpg="$OUT/.poster-${hash:0:8}.jpg"
    if ffmpeg -y -loglevel error -ss 0.4 -i "$file" -frames:v 1 -q:v 4 "$tmpjpg" 2>>"$LOG"; then
      magick "$tmpjpg" -auto-orient -resize "480x480^" -gravity center -extent 480x480 -quality 80 "$OUT/$poster" 2>>"$LOG" || true
      rm -f "$tmpjpg"
    fi
  fi
  printf '%s\tvideo\t%s\t%s\t%s\n' "$target" "$date" "$desc" "$hash" >> "$MANIFEST"
}

export -f processImage processVideo
export OUT MANIFEST LOG

echo "Processing images..."
find "$SRC" -maxdepth 1 -name '*.jpg' -print0 | \
  xargs -0 -n 1 -P 8 -I {} bash -c 'processImage "$@"' _ {}

echo "Processing videos..."
find "$SRC" -maxdepth 1 -name '*.mp4' -print0 | \
  xargs -0 -n 1 -P 4 -I {} bash -c 'processVideo "$@"' _ {}

sort -u -k1,1 "$MANIFEST" -o "$MANIFEST"
echo "DONE: $(wc -l < "$MANIFEST") manifest entries"
echo "OUTPUT: $(find "$OUT" -name '*.webp' -o -name '*.mp4' | wc -l) files"
