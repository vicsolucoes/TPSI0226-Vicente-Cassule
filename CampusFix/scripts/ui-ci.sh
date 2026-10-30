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
export CAMPUSFIX_TEST_PASSWORD="$(python3 -c "import secrets; print(secrets.token_urlsafe(24) + 'Aa9!')")"
if [ "${GITHUB_ACTIONS:-false}" = true ]; then
  printf '::add-mask::%s\n' "$CAMPUSFIX_TEST_PASSWORD"
fi
export CAMPUSFIX_UI_APP="$UI_APP"
python3 - <<'RUNTIME_ACCOUNTS'
import os
from pathlib import Path
root = Path(os.environ['CAMPUSFIX_UI_APP'])
(root / '.mxcli').mkdir(exist_ok=True)
password = os.environ['CAMPUSFIX_TEST_PASSWORD']
roles = [('cf_aluno_a', 'Utilizador'), ('cf_aluno_b', 'Utilizador'), ('cf_tecnico', 'Tecnico'), ('cf_admin', 'Administrator')]
lines = ['mdl 1;', 'alter app security (EnableDemoUsers: true);']
for name, role in roles:
    lines.append(f"create or modify demo user '{name}' (Password: '{password}', Entity: Administration.Account, UserRoles: ({role}));")
(root / '.mxcli' / 'ui-demo-runtime.mdl').write_text('\n'.join(lines))
RUNTIME_ACCOUNTS
"$MXCLI" exec "$UI_APP/.mxcli/ui-demo-runtime.mdl" -p "$UI_APP/CampusFix.mpr"
"$MXCLI" run --local --setup --db-type hsqldb -p "$UI_APP/CampusFix.mpr"
"$MXCLI" run --local --detach --db-type hsqldb -p "$UI_APP/CampusFix.mpr"
npm install --prefix "$UI_DEPS" --no-audit --no-fund playwright@1.56.1
"$UI_DEPS/node_modules/.bin/playwright" install --with-deps chromium
NODE_PATH="$UI_DEPS/node_modules" CAMPUSFIX_EVIDENCIAS="$APP_DIR/docs/evidencias" node "$APP_DIR/scripts/ui-test.cjs"
