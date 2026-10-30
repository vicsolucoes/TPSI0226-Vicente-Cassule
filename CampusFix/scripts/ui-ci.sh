#!/usr/bin/env bash
set -euo pipefail
MXCLI="$(realpath "${1:?Indica o executável mxcli}")"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UI_APP="$(mktemp -d "${RUNNER_TEMP:-/tmp}/campusfix-ui-app-XXXXXX")"
UI_DEPS="$(mktemp -d "${RUNNER_TEMP:-/tmp}/campusfix-ui-deps-XXXXXX")"
rsync -a --exclude='deployment' --exclude='.mxcli' --exclude='reports' "$APP_DIR/" "$UI_APP/"
cleanup() {
  "$MXCLI" run stop -p "$UI_APP/CampusFix.mpr" || true
  if [ -f "$UI_APP/.mxcli/run.log" ]; then
    tail -100 "$UI_APP/.mxcli/run.log" > "$APP_DIR/reports/arranque-interface.log"
  fi
}
trap cleanup EXIT
"$MXCLI" exec "$UI_APP/tests/ui-demo.mdl" -p "$UI_APP/CampusFix.mpr"
"$MXCLI" run --local --setup --db-type hsqldb -p "$UI_APP/CampusFix.mpr"
"$MXCLI" run --local --detach --db-type hsqldb -p "$UI_APP/CampusFix.mpr"
npm install --prefix "$UI_DEPS" --no-audit --no-fund playwright@1.56.1
"$UI_DEPS/node_modules/.bin/playwright" install --with-deps chromium
NODE_PATH="$UI_DEPS/node_modules" CAMPUSFIX_EVIDENCIAS="$APP_DIR/docs/evidencias" node "$APP_DIR/scripts/ui-test.cjs"
