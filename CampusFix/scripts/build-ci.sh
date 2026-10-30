#!/usr/bin/env bash
set -euo pipefail
MXCLI="$(realpath "${1:?Indica o executável mxcli}")"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MPR="$APP_DIR/CampusFix.mpr"
cd "$APP_DIR"
mkdir -p reports
"$MXCLI" setup mxbuild -p "$MPR"
for source in mdlsource/*.mdl; do
  "$MXCLI" check "$source" -p "$MPR" --references
  "$MXCLI" exec "$source" -p "$MPR"
done
"$MXCLI" docker check -p "$MPR" 2>&1 | tee reports/mendix-check.log
"$MXCLI" -p "$MPR" -c 'list modules; list microflows in CampusFix; list pages in CampusFix; describe security matrix in CampusFix' > reports/modelo.txt
"$MXCLI" lint -p "$MPR" --exclude System --exclude Administration --exclude Atlas_Core --exclude Atlas_Web_Content --exclude Atlas_Web_Layouts --exclude DataWidgets --exclude FeedbackModule --exclude NanoflowCommons > reports/lint.txt 2>&1 || true
if [ -f tests/regras.test.mdl ]; then
  "$MXCLI" test tests/ -p "$MPR" --local --db-type hsqldb --junit reports/testes.xml 2>&1 | tee reports/testes.log
fi
