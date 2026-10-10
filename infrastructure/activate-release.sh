#!/usr/bin/env bash
set -euo pipefail
root=/var/www/astro-blog
id=${1:?release id required}
[[ "$id" =~ ^(content|source)-[0-9]+-[0-9]+$ ]] || { echo 'Invalid release id' >&2; exit 1; }
release="$root/releases/$id"
[[ -f "$release/index.html" && -f "$release/404.html" ]] || { echo 'Incomplete release' >&2; exit 1; }
[[ -L "$root/current" ]] || { echo 'Run the root setup script before publication' >&2; exit 1; }
exec 9>"$root/.publish.lock"
flock -w 60 9
previous=$(readlink "$root/current")
chmod -R u=rwX,g=rX,o=rX "$release"
ln -s "releases/$id" "$root/.current-next"
mv -Tf "$root/.current-next" "$root/current"
if ! curl --fail --silent --show-error --max-time 20 --resolve chenzhixing.bbroot.com:443:127.0.0.1 https://chenzhixing.bbroot.com/ > /dev/null; then
  ln -s "$previous" "$root/.current-next"
  mv -Tf "$root/.current-next" "$root/current"
  echo 'Health check failed; previous release restored' >&2
  exit 1
fi
printf '%s\n' "$previous" > "$root/.previous-release"
echo "Activated $id; previous release retained"
