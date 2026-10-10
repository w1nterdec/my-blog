#!/usr/bin/env bash
# Update only the OAuth bridge; preserve all static blog files and publication switches.
set -euo pipefail
if [[ $(id -u) != 0 ]]; then echo 'Run this script as root.' >&2; exit 1; fi
revision=${1:-}
if [[ ! $revision =~ ^[a-f0-9]{40}$ ]]; then echo 'Provide an exact source commit SHA.' >&2; exit 1; fi
node=/opt/zhixing-admin/node
service=/opt/zhixing-admin/index.mjs
env_file=/etc/zhixing-admin.env
[[ -x $node && -f $service && -f $env_file ]] || { echo 'Existing admin service was not found.' >&2; exit 1; }
backup=$(mktemp -d /opt/zhixing-admin/repair-XXXXXXXX)
chmod 700 "$backup"
cp -p "$service" "$backup/index.mjs"
cp -p "$env_file" "$backup/admin.env"
chmod 600 "$backup/admin.env"
curl --fail --silent --show-error --connect-timeout 10 --max-time 60 "https://raw.githubusercontent.com/w1nterdec/my-blog/$revision/server/admin/index.mjs" -o "$backup/next.mjs"
"$node" --check "$backup/next.mjs"
rollback() {
  cp -p "$backup/index.mjs" "$service"
  cp -p "$backup/admin.env" "$env_file"
  systemctl restart zhixing-admin || true
  echo "Update failed; original service and configuration restored. Backup: $backup" >&2
}
trap rollback ERR
cat "$backup/next.mjs" > "$service"
python3 - "$env_file" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
lines = [line for line in p.read_text().splitlines() if not line.startswith('ADMIN_LOCAL_EDITOR_ORIGIN=')]
lines.append('ADMIN_LOCAL_EDITOR_ORIGIN=http://127.0.0.1:4323')
p.write_text('\n'.join(lines) + '\n')
PY
systemctl restart zhixing-admin
ready=false
for attempt in {1..15}; do
  if [[ $(curl --silent --fail --max-time 2 http://127.0.0.1:4322/api/admin/health || true) == ready ]]; then ready=true; break; fi
  sleep 1
done
[[ $ready == true ]]
trap - ERR
echo "ready — local editor http://127.0.0.1:4323 is enabled. Backup: $backup"
