#!/usr/bin/env bash
# Crop license plate evidence photos to highlight the plate, output landscape WebP.
# Backs up originals to public/_orig_plates/ first (already done manually).
set -euo pipefail
cd "$(dirname "$0")/../public"

src() { echo "_orig_plates/$1"; }
out() { echo "$1"; }

# Helpers
crop() {
  # crop <name> <crop_geometry> <resize>
  local name="$1" geom="$2" resize="$3"
  magick "$(src "$name")" -auto-orient -crop "$geom" +repage -resize "$resize" -strip -quality 88 "$(out "$name")"
}
crop_rotate() {
  # crop_rotate <name> <rotate_deg> <crop_geometry_after_rotate> <resize>
  local name="$1" rot="$2" geom="$3" resize="$4"
  magick "$(src "$name")" -auto-orient -rotate "$rot" -crop "$geom" +repage -resize "$resize" -strip -quality 88 "$(out "$name")"
}

# === Upright plates: tight crop centered on the plate ===

# 28666MG (orig 800x770) — plate ~y530-680, x270-540
crop evidence-plate-28666mg.webp   "640x400+80+390"  "1200x750"

# 4 HUGS (orig 800x867) — plate ~y660-790, x270-580
crop evidence-plate-4hugs.webp     "620x340+90+560"  "1200x658"

# AB SENATE (orig 800x1067) — small plate ~y370-580, x40-280
crop evidence-plate-ab-senate.webp "440x300+10+340"  "1200x818"

# AHOYA (orig 800x867) — plate ~y560-810 (cuts right edge), x250-800
crop evidence-plate-ahoya.webp     "650x380+150+520" "1200x701"

# AIRCREW (orig 800x914) — plate ~y600-700, x290-560
crop evidence-plate-aircrew.webp   "560x320+120+560" "1200x686"

# BALLSY (orig 800x780) — small plate at bottom y660-720, x340-500
crop evidence-plate-ballsy.webp    "500x260+150+560" "1200x624"

# BAN (orig 800x1067) — close-up plate, large in frame
crop evidence-plate-ban.webp       "740x460+30+150" "1200x745"

# BBQCHEF (orig 800x953) — plate ~y560-880, x150-790
crop evidence-plate-bbqchef.webp   "700x420+50+540" "1200x720"

# BLCKCHN (orig 800x600) — small plate centered ~y230-340, x230-450
crop evidence-plate-blckchn.webp   "400x240+170+200" "1200x720"

# BRYIAN — source photo unusable (plate only visible as windshield reflection); removed from montage

# DEMONZ (orig 800x953) — DEMON7 plate at very bottom ~y870-940
crop evidence-plate-demonz.webp    "560x280+120+670" "1200x600"

# DJEAT (orig 800x780) — plate cut off at bottom, "DJEAT" label visible y700-780
crop evidence-plate-djeat.webp     "660x250+70+540"  "1200x455"

# DVNMRCY (orig 800x338) — already plate-focused, keep most
crop evidence-plate-dvnmrcy.webp   "720x320+40+10"   "1200x534"

# GD2BEME (orig 800x600 rotated CCW) — rotate 90° CW; plate ~y340-440, x200-460
crop_rotate evidence-plate-gd2beme.webp 90 "320x140+180+330" "1200x525"

# LDS MOM (orig 800x797) — plate y340-510, x210-590
crop evidence-plate-ldsmom.webp    "560x340+170+300" "1200x729"

# OP 4999 (orig 800x797) — large plate y290-620, x80-720
crop evidence-plate-op4999.webp    "700x400+50+260"  "1200x686"

# PETSITR (orig 800x780) — plate y540-700, x240-590
crop evidence-plate-petsitr.webp   "600x300+100+520" "1200x600"

# PRIDE (orig 800x600 rotated CCW) — rotate 90° CW; plate ~y390-460, x230-360
crop_rotate evidence-plate-pride.webp 90 "200x110+205+380" "1200x660"

# TRLHAWK (orig 800x867) — plate cut at bottom y705-867, x250-590
crop evidence-plate-trlhawk.webp   "600x250+100+650" "1200x500"

# UPNAY (orig 800x600 rotated CCW) — rotate 90° CW; plate ~y260-380, x140-380
crop_rotate evidence-plate-upnay.webp 90 "280x150+120+250" "1200x643"

# WC6675 (orig 800x780) — plate y480-630, x270-540
crop evidence-plate-wc6675.webp    "500x280+150+450" "1200x672"

# === Rotated images: rotate first, then crop ===

# JUMPMAN (orig 800x600 rotated CCW) — rotate 90° CW; plate ~y450-530, x240-460
crop_rotate evidence-plate-jumpman.webp 90 "260x110+220+440" "1200x508"

echo "All crops done."
ls -la evidence-plate-*.webp | head -25
