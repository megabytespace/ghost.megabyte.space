#!/usr/bin/env bash
set -euo pipefail

# Generates 3 logo candidates via OpenAI GPT Image 1.5 (gpt-image-1).
# Outputs to public/logo-candidates/{1,2,3}.png

OPENAI_API_KEY="$(grep '^OPENAI_API_KEY=' "$HOME/.claude/.env" | head -1 | cut -d= -f2-)"
OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/public/logo-candidates"
mkdir -p "$OUT_DIR"

PROMPT_1="Minimalist square app icon for a paranormal EMF research project. Single bold ghost emoji silhouette merged with a glowing EMF antenna pulse line. Electric cyan #00E5FF on pure black void background, subtle violet #7C3AED glow on edges. Flat vector style, thick rounded strokes, generous negative space, perfectly centered. No text, no watermark, no characters, no captions. Square 1:1 composition, fully fills the frame, app-icon ready. Premium, distinctive, anti-AI-slop aesthetic."
PROMPT_2="Bold geometric square app icon. A circular spectral ghost head with two glowing dot eyes and a single horizontal sine-wave EMF pulse cutting through the center. Cyberpunk monospace aesthetic. Electric cyan #00E5FF as primary, single sharp magenta-violet #7C3AED accent stripe. Pure black background. Flat vector logo mark, balanced silhouette, sharp edges, fills the entire frame. No text, no watermark, no characters. Square 1:1, app-icon proportions. Premium minimalist."
PROMPT_3="Mystical sigil-style square app icon for a public EMF entropy science project. A soft ghost spirit silhouette encircled by a thin double sine-wave halo, suggesting paranormal radio frequencies. Holographic neon cyan #00E5FF and ultraviolet #7C3AED on deep void black. Distinctive, premium, fully centered, fills the frame. App-icon proportions, flat 2D vector mark, no shading, no text, no watermark, no characters. Square 1:1."

call_openai() {
  local prompt="$1"
  local idx="$2"
  echo "→ Generating logo $idx via gpt-image-1..."
  RESPONSE_FILE="/tmp/claude/openai-img-$idx.json"
  curl -sS -m 180 https://api.openai.com/v1/images/generations \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg p "$prompt" '{
      model: "gpt-image-1",
      prompt: $p,
      n: 1,
      size: "1024x1024",
      background: "opaque",
      output_format: "png",
      quality: "high"
    }')" > "$RESPONSE_FILE"

  if jq -e '.error' "$RESPONSE_FILE" >/dev/null 2>&1; then
    echo "  ✗ Error $idx: $(jq -r '.error.message' "$RESPONSE_FILE")"
    return 1
  fi

  B64="$(jq -r '.data[0].b64_json // empty' "$RESPONSE_FILE")"
  URL="$(jq -r '.data[0].url // empty' "$RESPONSE_FILE")"
  if [ -n "$B64" ]; then
    echo "$B64" | base64 -D > "$OUT_DIR/$idx.png"
  elif [ -n "$URL" ]; then
    curl -sS -L "$URL" -o "$OUT_DIR/$idx.png"
  else
    echo "  ✗ No image data in response $idx"
    head -c 400 "$RESPONSE_FILE"
    return 1
  fi
  echo "  ✓ Saved $OUT_DIR/$idx.png ($(wc -c <"$OUT_DIR/$idx.png") bytes)"
}

call_openai "$PROMPT_1" 1 &
P1=$!
call_openai "$PROMPT_2" 2 &
P2=$!
call_openai "$PROMPT_3" 3 &
P3=$!

wait $P1 $P2 $P3 || true
ls -la "$OUT_DIR"
