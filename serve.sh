#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# App ko local server par chalane ke liye. file:// se app nahi chalegi kyunki
# browser model.json ko fetch nahi karne deta (CORS/file protocol restriction).
#
# Chalane ka tarika:   bash serve.sh      (ya:  chmod +x serve.sh && ./serve.sh)
# ---------------------------------------------------------------------------
set -e
PORT="${1:-8000}"
cd "$(dirname "$0")"

echo ""
echo "🌾  Rice Disease Detection app chal rahi hai"
echo "    Computer par kholein : http://localhost:${PORT}"

# Phone se test karne ke liye same Wi-Fi par local IP bhi dikha dete hain
IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')"
if [ -n "$IP" ]; then
  echo "    Phone par kholein    : http://${IP}:${PORT}   (same Wi-Fi hona chahiye)"
fi
echo "    Band karne ke liye   : Ctrl + C"
echo ""

python3 -m http.server "$PORT"
