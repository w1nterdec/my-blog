#!/usr/bin/env bash
set -euo pipefail
root=${BLOG_ROOT:-/var/www/astro-blog}
exec 9>"$root/.publish.lock"
flock -w 60 9
previous=$(cat "$root/.previous-release")
[[ "$previous" =~ ^releases/((source|content)-[0-9]+-[0-9]+|legacy-[0-9]+T[0-9]+Z)$ ]] || { echo 'Invalid previous release' >&2; exit 1; }
[[ -f "$root/$previous/index.html" && -L "$root/current" ]] || { echo 'Previous release unavailable' >&2; exit 1; }
current=$(readlink "$root/current")
ln -s "$previous" "$root/.current-next"
mv -Tf "$root/.current-next" "$root/current"
if ! curl --fail --silent --show-error --max-time 20 --resolve chenzhixing.bbroot.com:443:127.0.0.1 https://chenzhixing.bbroot.com/ > /dev/null; then
  ln -s "$current" "$root/.current-next"
  mv -Tf "$root/.current-next" "$root/current"
  echo 'Rollback health check failed; current release restored' >&2
  exit 1
fi
printf '%s\n' "$current" > "$root/.previous-release"
echo "Restored $previous"
