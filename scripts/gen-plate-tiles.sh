#!/usr/bin/env bash
set -euo pipefail
MANIFEST="/Users/apple/emdash-projects/worktrees/puny-chairs-create-9eu/public/plates-all/_manifest.tsv"
OUT="/Users/apple/emdash-projects/worktrees/puny-chairs-create-9eu/scripts/plate-tiles.html"

humanize() {
  local s="$1"
  echo "$s" | tr '-' ' ' | awk '{ for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2)) } 1'
}

dateLabel() {
  local d="$1"
  if [[ "$d" == "0000-00-00" ]]; then
    echo "UNDATED"
  else
    echo "$d"
  fi
}

: > "$OUT"

# Sort with dated entries first chronologically, undated last
(grep -v '^[^	]*	[^	]*	0000-00-00	' "$MANIFEST" | sort -k3,3; grep '^[^	]*	[^	]*	0000-00-00	' "$MANIFEST") | while IFS=$'\t' read -r filename type date desc hash; do
  base="${filename%.*}"
  label="$(dateLabel "$date") · $(humanize "$desc")"
  # Truncate label if too long
  if [[ ${#label} -gt 56 ]]; then
    label="${label:0:53}..."
  fi
  alt_text="$(echo "$desc" | tr '-' ' ') ($date)"

  if [[ "$type" == "image" ]]; then
    cat >> "$OUT" <<HTML
            <figure class="plate-vault-card">
              <img src="/plates-all/$filename" alt="$alt_text" loading="lazy" decoding="async" />
              <figcaption><span class="plate-vault-label">$label</span></figcaption>
            </figure>
HTML
  else
    cat >> "$OUT" <<HTML
            <figure class="plate-vault-card plate-vault-card-video">
              <video preload="none" muted playsinline controls loop poster="/plates-all/${base}-poster.webp">
                <source src="/plates-all/$filename" type="video/mp4" />
              </video>
              <figcaption><span class="plate-vault-label">$label</span></figcaption>
            </figure>
HTML
  fi
done

echo "Generated $(grep -c '<figure' "$OUT") tile(s) in $OUT"
