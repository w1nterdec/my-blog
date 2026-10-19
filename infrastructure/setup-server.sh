#!/usr/bin/env bash
set -euo pipefail
[[ $(id -u) -eq 0 ]] || { echo 'Run with root privileges' >&2; exit 1; }
bundle=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
deploy_user=${1:-deploy}
root=/var/www/astro-blog
getent passwd "$deploy_user" >/dev/null
[[ -f "$bundle/nginx-vps.conf" && -f "$bundle/log-stats.py" ]] || { echo 'Incomplete infrastructure directory' >&2; exit 1; }

apt-get update
apt-get install -y nginx certbot python3-certbot-nginx curl rsync python3 util-linux
backup="/var/backups/zhixing/$(date -u +%Y%m%dT%H%M%SZ)"
install -d -m 700 "$backup"
if [[ -f /etc/nginx/sites-available/astro-blog ]]; then
  cp -a /etc/nginx/sites-available/astro-blog "$backup/nginx.conf"
fi
install -d -o "$deploy_user" -g www-data -m 755 "$root" "$root/releases"
if [[ ! -L "$root/current" ]]; then
  legacy="$root/releases/legacy-$(date -u +%Y%m%dT%H%M%SZ)"
  install -d -o "$deploy_user" -g www-data -m 755 "$legacy"
  for item in "$root"/*; do
    [[ "$item" == "$root/releases" || "$item" == "$root/current" || "$item" == "$root/shared" ]] && continue
    cp -a "$item" "$legacy/"
  done
  [[ -f "$legacy/index.html" ]] || printf '<!doctype html><html lang="zh-CN"><title>部署中</title><p>网站正在部署。</p></html>\n' > "$legacy/index.html"
  ln -s "${legacy#"$root/"}" "$root/current"
fi
chown -R "$deploy_user":www-data "$root/releases"

install -d -m 755 /opt/zhixing-stats
install -m 644 "$bundle/log-stats.py" /opt/zhixing-stats/log-stats.py
printf '%s\n' '23 3 * * * root /usr/bin/python3 /opt/zhixing-stats/log-stats.py' > /etc/cron.d/zhixing-stats
install -m 644 "$bundle/nginx-vps.conf" /etc/nginx/sites-available/astro-blog
ln -sfn /etc/nginx/sites-available/astro-blog /etc/nginx/sites-enabled/astro-blog
if ! nginx -t; then
  if [[ -f "$backup/nginx.conf" ]]; then cp -a "$backup/nginx.conf" /etc/nginx/sites-available/astro-blog; fi
  exit 1
fi
systemctl enable --now nginx
systemctl reload nginx
if ! certbot --nginx --non-interactive --agree-tos --email zhixing0810cz@gmail.com -d chenzhixing.bbroot.com --redirect; then
  if [[ -f "$backup/nginx.conf" ]]; then
    cp -a "$backup/nginx.conf" /etc/nginx/sites-available/astro-blog
    nginx -t && systemctl reload nginx
  fi
  echo "Certificate setup failed. Check Nginx; backup: $backup" >&2
  exit 1
fi
systemctl enable --now certbot.timer
# Nginx now closes the former public routes. Retain old credentials for recovery.
if systemctl cat zhixing-admin.service >/dev/null 2>&1; then
  systemctl disable --now zhixing-admin.service
fi
curl --fail --silent --show-error https://chenzhixing.bbroot.com/ > /dev/null
printf '\nStatic server setup complete. Backup: %s\n' "$backup"
