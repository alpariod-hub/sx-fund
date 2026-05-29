#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# SX Fund — Vultr Frankfurt (45.32.158.100) setup script
# Run ONCE on the server:
#   chmod +x deploy/setup.sh && sudo ./deploy/setup.sh
#
# What this script does:
#   1. Firewall (ufw) — allow only 22, 80, 443
#   2. Node.js 22 LTS via NodeSource
#   3. PM2 — process manager
#   4. Nginx — reverse proxy
#   5. Certbot — Let's Encrypt SSL
#   6. Log directory
#   7. App directory + deploy user
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
DOMAIN="trinityfund.io"
API_SUBDOMAIN="api.${DOMAIN}"
HUB_SUBDOMAIN="sed-hub.${DOMAIN}"
APP_DIR="/var/www/sx-fund"
LOG_DIR="/var/log/sx-fund"
DEPLOY_USER="sx-fund"

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
section() { echo -e "\n${GREEN}══ $* ══${NC}"; }

# ── Must run as root ──────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  echo -e "${RED}Run as root: sudo ./setup.sh${NC}" && exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
section "1. Firewall (ufw)"
# ─────────────────────────────────────────────────────────────────────────────
apt-get install -y ufw

ufw default deny incoming
ufw default allow outgoing

ufw allow 22/tcp   comment "SSH"
ufw allow 80/tcp   comment "HTTP (redirect to HTTPS)"
ufw allow 443/tcp  comment "HTTPS"

# Optionally restrict SSH to your IPs:
# ufw allow from YOUR_IP to any port 22

ufw --force enable
info "Firewall enabled. Status:"
ufw status verbose

# ─────────────────────────────────────────────────────────────────────────────
section "2. System packages"
# ─────────────────────────────────────────────────────────────────────────────
apt-get update -q
apt-get install -y curl gnupg2 build-essential git nginx certbot python3-certbot-nginx

# ─────────────────────────────────────────────────────────────────────────────
section "3. Node.js 22 LTS"
# ─────────────────────────────────────────────────────────────────────────────
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
node --version
npm --version

# ─────────────────────────────────────────────────────────────────────────────
section "4. pnpm + PM2"
# ─────────────────────────────────────────────────────────────────────────────
npm install -g pnpm@latest pm2@latest
pm2 --version

# ─────────────────────────────────────────────────────────────────────────────
section "5. Deploy user + directories"
# ─────────────────────────────────────────────────────────────────────────────
if ! id "${DEPLOY_USER}" &>/dev/null; then
  useradd -m -s /bin/bash "${DEPLOY_USER}"
  info "Created user: ${DEPLOY_USER}"
fi

mkdir -p "${APP_DIR}" "${LOG_DIR}"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_DIR}" "${LOG_DIR}"
info "App dir: ${APP_DIR}"
info "Log dir: ${LOG_DIR}"

# ─────────────────────────────────────────────────────────────────────────────
section "6. Nginx — install config"
# ─────────────────────────────────────────────────────────────────────────────
# Copy config (assumes repo is cloned to $APP_DIR)
if [[ -f "${APP_DIR}/deploy/nginx.conf" ]]; then
  cp "${APP_DIR}/deploy/nginx.conf" /etc/nginx/sites-available/trinityfund
  ln -sf /etc/nginx/sites-available/trinityfund /etc/nginx/sites-enabled/trinityfund
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx
  info "Nginx config installed and reloaded"
else
  warn "nginx.conf not found at ${APP_DIR}/deploy/nginx.conf — copy manually"
fi

# ─────────────────────────────────────────────────────────────────────────────
section "7. SSL — Let's Encrypt"
# ─────────────────────────────────────────────────────────────────────────────
warn "Make sure DNS A-records for ${DOMAIN}, ${API_SUBDOMAIN}, ${HUB_SUBDOMAIN}"
warn "point to this server IP AND Cloudflare proxy is OFF (grey cloud) during cert issuance."
warn ""
warn "Run after DNS propagates:"
warn "  sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} -d ${API_SUBDOMAIN} -d ${HUB_SUBDOMAIN}"
warn ""
warn "After cert is issued, re-enable Cloudflare proxy (orange cloud) for all A-records."

# ─────────────────────────────────────────────────────────────────────────────
section "8. PM2 systemd startup"
# ─────────────────────────────────────────────────────────────────────────────
pm2 startup systemd -u "${DEPLOY_USER}" --hp "/home/${DEPLOY_USER}"
info "PM2 startup configured for user: ${DEPLOY_USER}"

# ─────────────────────────────────────────────────────────────────────────────
section "Done ✓"
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "Next steps:"
echo "  1. Clone repo:  git clone <repo-url> ${APP_DIR}"
echo "  2. Copy env:    cp ${APP_DIR}/deploy/.env.example ${APP_DIR}/.env.production"
echo "  3. Edit env:    nano ${APP_DIR}/.env.production"
echo "  4. Install SSL: sudo certbot --nginx -d ${DOMAIN} -d ${API_SUBDOMAIN} -d ${HUB_SUBDOMAIN}"
echo "  5. Build app:   cd ${APP_DIR} && pnpm install && pnpm run build"
echo "  6. Start:       pm2 start ${APP_DIR}/deploy/ecosystem.config.cjs --env production --env-file ${APP_DIR}/.env.production"
echo "  7. Save:        pm2 save"
echo "  8. Register webhook: curl -X POST https://${API_SUBDOMAIN}/api/bot/setup-webhook -H 'x-admin-secret: YOUR_ADMIN_SECRET'"
echo ""
