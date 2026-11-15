#!/bin/bash
# Cap versi ke index.html (?v=<hash> pada css/js; cache GitHub Pages ±10 menit) + versi.txt (chip "Versi baru").
set -e
cd "$(dirname "$0")"
H=$(cat index.src.html app.css app.js tools.js data/*.js | shasum | cut -c1-12)
sed "s/%%VERSI%%/$H/g" index.src.html > index.html
echo "$H" > versi.txt
for f in app.js tools.js data/*.js; do node --check "$f"; done
node tools/cek.js
echo "versi $H"
