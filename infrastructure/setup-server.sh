#!/usr/bin/env bash
set -euo pipefail
[[ $(id -u) -eq 0 ]] || { echo 'Run with root privileges' >&2; exit 1; }
bundle=$(realpath "${1:?path to setup bundle required}")
deploy_user=${2:-deploy}
domain=chenzhixing.bbroot.com
getent passwd "$deploy_user" >/dev/null
[[ -f "$bundle/admin.env" && -f "$bundle/index.mjs" && -f "$bundle/zhixing-admin.service" ]] || { echo 'Incomplete setup bundle' >&2; exit 1; }
# Keep the former Nginx configuration available for recovery.
backup="/var/backups/zhixing/$(date -u +%Y%m%dT%H%M%SZ)"
install -d -m 700 "$backup"
cp -a /etc/nginx/sites-available/astro-blog "$backup/nginx.conf"
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx curl xz-utils
architecture=$(uname -m)
case "$architecture" in x86_64) arch=x64;; aarch64) arch=arm64;; *) echo 'Unsupported architecture' >&2; exit 1;; esac
version=v24.19.0
archive="node-$version-linux-$arch.tar.xz"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
curl -fsSL "https://nodejs.org/dist/$version/$archive" -o "$tmp/$archive"
curl -fsSL "https://nodejs.org/dist/$version/SHASUMS256.txt" -o "$tmp/SHASUMS256.txt"
(cd "$tmp" && grep " $archive\$" SHASUMS256.txt | sha256sum -c -)
install -d /opt/zhixing-admin
# Extract the verified binary into this service's directory, without replacing system Node.
tar -xJf "$tmp/$archive" -C "$tmp"
install -m 755 "$tmp/node-$version-linux-$arch/bin/node" /opt/zhixing-admin/node
id zhixing-admin >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin zhixing-admin
install -m 644 "$bundle/index.mjs" /opt/zhixing-admin/index.mjs
install -m 644 "$bundle/log-stats.py" /opt/zhixing-admin/log-stats.py
printf "%s\n" "23 3 * * * root /usr/bin/python3 /opt/zhixing-admin/log-stats.py" > /etc/cron.d/zhixing-stats
install -m 600 "$bundle/admin.env" /etc/zhixing-admin.env
sed 's|/usr/bin/node |/opt/zhixing-admin/node |' "$bundle/zhixing-admin.service" > /etc/systemd/system/zhixing-admin.service
root=/var/www/astro-blog
install -d -o "$deploy_user" -g www-data -m 775 "$root/releases"
if [[ ! -L "$root/current" ]]; then
  legacy="$root/releases/legacy-$(date -u +%Y%m%dT%H%M%SZ)"
  install -d -o "$deploy_user" -g www-data -m 775 "$legacy"
  for item in "$root"/*; do
    [[ "$item" == "$root/releases" || "$item" == "$root/current" ]] && continue
    cp -a "$item" "$legacy/"
  done
  ln -s "${legacy#"$root/"}" "$root/current"
fi
chown -R "$deploy_user":www-data "$root/releases"
cat > /etc/nginx/sites-available/astro-blog <<'NGINX'
server {
  listen 80;
  listen [::]:80;
  server_name chenzhixing.bbroot.com;
  root /var/www/astro-blog/current;
  index index.html;
  charset utf-8;
  access_log /var/log/nginx/zhixing-access.log combined;
  location = /stats.json { alias /var/www/astro-blog/shared/stats.json; add_header Cache-Control "public, max-age=600"; }
  server_tokens off;
  gzip on;
  gzip_types text/css application/javascript application/json image/svg+xml application/xml;
  location / { try_files $uri $uri/ =404; }
  error_page 404 /404.html;
  location = /404.html { internal; }
  location /_astro/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
  location /uploads/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
  location /admin/ { add_header Cache-Control "no-store"; add_header X-Robots-Tag "noindex, nofollow"; }
  location /api/admin/ { proxy_pass http://127.0.0.1:4322; proxy_read_timeout 25s; add_header Cache-Control "no-store" always; }
  location ~ /\. { deny all; }
}
NGINX
if ! nginx -t; then cp "$backup/nginx.conf" /etc/nginx/sites-available/astro-blog; exit 1; fi
systemctl daemon-reload
systemctl enable --now zhixing-admin
systemctl reload nginx
# Certbot inserts the HTTPS server and HTTP redirect. The email is already public.
if ! certbot --nginx --non-interactive --agree-tos --email zhixing0810cz@gmail.com -d "$domain" --redirect; then
  cp "$backup/nginx.conf" /etc/nginx/sites-available/astro-blog
  nginx -t && systemctl reload nginx
  echo "Certificate setup failed; previous Nginx restored" >&2
  exit 1
fi
systemctl enable --now certbot.timer
curl -fsS "https://$domain/api/admin/health"
printf '\nSetup complete. Backup: %s\n' "$backup"
