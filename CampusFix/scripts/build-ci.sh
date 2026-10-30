#!/usr/bin/env bash
set -euo pipefail
MXCLI="$(realpath "${1:?Indica o executável mxcli}")"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MPR="$APP_DIR/CampusFix.mpr"
cd "$APP_DIR"
mkdir -p reports
trap 'python3 scripts/sanitize-model.py "$MPR"' EXIT
"$MXCLI" setup mxbuild -p "$MPR"
"$MXCLI" -p "$MPR" -c 'list pages in Administration; list module roles; describe navigation' > reports/base.txt
for source in mdlsource/*.mdl; do
  "$MXCLI" check "$source" -p "$MPR" --references
  "$MXCLI" exec "$source" -p "$MPR"
done
if ! grep -q 'campusfix' theme/web/main.scss; then
  printf '\n@import "campusfix";\n' >> theme/web/main.scss
fi
"$MXCLI" fix widgets -p "$MPR"
python3 scripts/sanitize-model.py "$MPR" --prepare-runtime
"$MXCLI" docker check --no-update-widgets -p "$MPR" 2>&1 | tee reports/mendix-check.log
"$MXCLI" -p "$MPR" -c 'list modules; list microflows in CampusFix; list pages in CampusFix; describe security matrix in CampusFix' > reports/modelo.txt
"$MXCLI" lint -p "$MPR" --exclude System --exclude Administration --exclude Atlas_Core --exclude Atlas_Web_Content --exclude Atlas_Web_Layouts --exclude DataWidgets --exclude FeedbackModule --exclude NanoflowCommons > reports/lint.txt 2>&1 || true
if [ -f tests/regras.test.mdl ]; then
  "$MXCLI" exec tests/fixtures.mdl -p "$MPR"
  set +e
  "$MXCLI" test tests/regras.test.mdl -p "$MPR" --local --db-type hsqldb --junit reports/testes.xml 2>&1 | tee reports/testes.log
  TEST_STATUS=${PIPESTATUS[0]}
  set -e
  "$MXCLI" -p "$MPR" -c 'drop module CampusFixTest;'
  if [ "$TEST_STATUS" -ne 0 ]; then exit "$TEST_STATUS"; fi
fi

python3 scripts/sanitize-model.py "$MPR"
trap - EXIT
