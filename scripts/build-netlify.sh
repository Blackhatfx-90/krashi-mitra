#!/usr/bin/env bash
# ============================================================================
# Netlify ke liye dist/ taiyar karta hai
#
# KYUN ALAG dist/ — seedha repo ki jad se publish karne par admin/node_modules
# (199 MB) bhi chadh jaata. Yahan sirf wahi jaata hai jo browser ko chahiye.
#
# Naya folder joda ho to neeche ITEMS me uska naam daal dein — bas.
# ============================================================================
set -euo pipefail

OUT="dist"
rm -rf "$OUT"
mkdir -p "$OUT"

ITEMS=(
  index.html app.html login.html signup.html forgot-password.html
  privacy.html terms.html
  sw.js manifest.json icon.svg robots.txt sitemap.xml
  css js assets models data guide vosk
  regional-admin admin-portal
)

for item in "${ITEMS[@]}"; do
  if [ -e "$item" ]; then
    cp -R "$item" "$OUT/"
  else
    echo "  (chhoda: $item — hai hi nahi)"
  fi
done

# api/ aur lib/ function ke andar se aate hain, publish me nahi jaate.
# admin/ (React source + node_modules) bhi nahi — uska bana hua roop
# regional-admin/ me pehle se hai.

# ---------------------------------------------------------------------------
# SITE KA PATA — canonical, og:url, sitemap
#
# In files me abhi purana Vercel ka pata likha hai (37 jagah). Netlify par
# wo sirf bekaar nahi, NUKSANDEH hai: canonical Google ko batata hai ki
# "asli page wahan hai" — yani sara SEO purane pate ko chala jayega, aur
# og:image bhi tab tootegi jab purani site band ho.
#
# Hardcode karne ke bajaye build ke waqt badal dete hain. Netlify khud
# $URL deta hai (site ka apna pata, custom domain lagane par wahi).
# Source files chhute nahi — sirf dist/ me badalta hai.
#
# Deploy preview ka apna pata hota hai; canonical hamesha ASLI site par
# rehna chahiye, isliye DEPLOY_PRIME_URL nahi, $URL.
# ---------------------------------------------------------------------------
OLD_URL="https://krashi-mitrasih.vercel.app"
NEW_URL="${URL:-}"

if [ -n "$NEW_URL" ] && [ "$NEW_URL" != "$OLD_URL" ]; then
  NEW_URL="${NEW_URL%/}"
  echo "site ka pata badal rahe hain: $OLD_URL -> $NEW_URL"
  # -type f, aur sirf wahi files jinme pata ho sakta hai
  find "$OUT" -type f \( -name '*.html' -o -name '*.xml' -o -name '*.txt' -o -name '*.webmanifest' -o -name '*.json' \) \
    -exec sed -i.bak "s|${OLD_URL}|${NEW_URL}|g" {} +
  find "$OUT" -name '*.bak' -delete
  LEFT=$(grep -rl "$OLD_URL" "$OUT" 2>/dev/null | wc -l | tr -d ' ') || LEFT=0
  echo "  purana pata ab $LEFT file me bacha"
else
  echo "URL set nahi hai — pata waisa hi rehne diya ($OLD_URL)"
  echo "  (Netlify par URL apne aap milta hai; local build me nahi)"
fi

echo "dist/ taiyar:"
du -sh "$OUT"
