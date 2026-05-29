#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# SX Fund — one-shot installer for Vultr Frankfurt (Ubuntu 24.04)
#
# Usage (as root):
#   bash <(curl -fsSL https://raw.githubusercontent.com/alpariod-hub/sx-fund/main/install.sh)
#
# What it does:
#   1. Installs PostgreSQL, Nginx, Node 22, PM2 (if missing)
#   2. Creates local Postgres DB + user
#   3. Clones this repo into /var/www/sx-fund
#   4. Runs schema migration
#   5. Generates random secrets + writes .env.production
#   6. Starts API server via PM2 on port 8080
#   7. Configures Nginx (HTTP, port 80) — no SSL yet
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${GREEN}[✓]${NC} $*"; }
warn()    { echo -e "${YELLOW}[!]${NC} $*"; }
err()     { echo -e "${RED}[✗]${NC} $*"; exit 1; }
section() { echo -e "\n${CYAN}══════════════════════════════════════════════${NC}"; echo -e "${CYAN}  $*${NC}"; echo -e "${CYAN}══════════════════════════════════════════════${NC}"; }

[[ $EUID -ne 0 ]] && err "Run as root"

APP_DIR="/var/www/sx-fund"
LOG_DIR="/var/log/sx-fund"
DB_NAME="sx_fund"
DB_USER="sx_fund"
REPO="https://github.com/alpariod-hub/sx-fund.git"

# ── Telegram bot token (ask once) ─────────────────────────────────────────────
section "1. Telegram Bot Token"
if [[ -f "${APP_DIR}/.env.production" ]] && grep -q "^TELEGRAM_BOT_TOKEN=[0-9]" "${APP_DIR}/.env.production" 2>/dev/null; then
  TG_TOKEN=$(grep "^TELEGRAM_BOT_TOKEN=" "${APP_DIR}/.env.production" | cut -d= -f2-)
  info "Reusing existing TELEGRAM_BOT_TOKEN"
else
  echo -e "${YELLOW}Enter your Telegram Bot Token (from @BotFather):${NC}"
  read -r TG_TOKEN
  [[ -z "$TG_TOKEN" ]] && err "Token required"
fi
info "Token set"

# ── System packages ───────────────────────────────────────────────────────────
section "2. System packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl gnupg2 postgresql postgresql-client nginx 2>/dev/null
info "System packages OK"

# ── Node.js 22 ────────────────────────────────────────────────────────────────
section "3. Node.js 22"
if ! node --version 2>/dev/null | grep -q "^v2[2-9]"; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
fi
info "Node $(node --version)"

# ── PM2 ───────────────────────────────────────────────────────────────────────
section "4. PM2"
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2@latest --silent
fi
info "PM2 $(pm2 --version)"

# ── PostgreSQL database ───────────────────────────────────────────────────────
section "5. PostgreSQL"
systemctl enable --now postgresql

# Generate or reuse DB password
if [[ -f "${APP_DIR}/.env.production" ]] && grep -q "^DATABASE_URL=" "${APP_DIR}/.env.production" 2>/dev/null; then
  DB_PASS=$(grep "^DATABASE_URL=" "${APP_DIR}/.env.production" | sed 's|.*://[^:]*:\([^@]*\)@.*|\1|')
  info "Reusing existing DB password"
else
  DB_PASS=$(openssl rand -hex 20)
fi

# Create user + DB if not exists
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
info "Database ready: ${DB_NAME}"

DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?sslmode=disable"

# ── Clone / update repo ───────────────────────────────────────────────────────
section "6. Deploy code"
mkdir -p "${APP_DIR}" "${LOG_DIR}"

if [[ -d "${APP_DIR}/.git" ]]; then
  info "Updating existing clone…"
  git -C "${APP_DIR}" fetch origin main
  git -C "${APP_DIR}" reset --hard origin/main
else
  info "Cloning repository…"
  git clone --depth 1 "${REPO}" "${APP_DIR}"
fi
info "Code at: ${APP_DIR}"

# ── Run migrations ────────────────────────────────────────────────────────────
section "7. Database migration"
PGPASSWORD="${DB_PASS}" psql -U "${DB_USER}" -h localhost -d "${DB_NAME}" \
  -f "${APP_DIR}/deploy/migrate.sql" -q
info "Schema applied"

# ── Generate secrets ──────────────────────────────────────────────────────────
section "8. Environment"
SESSION_SECRET=$(openssl rand -hex 64)
TG_SECRET=$(openssl rand -hex 32)
ADMIN_SECRET=$(openssl rand -hex 24)

cat > "${APP_DIR}/.env.production" <<EOF
NODE_ENV=production
PORT=8080

DATABASE_URL=${DATABASE_URL}

TELEGRAM_BOT_TOKEN=${TG_TOKEN}
TELEGRAM_WEBHOOK_URL=https://api.trinityfund.io/api/bot/webhook
TELEGRAM_WEBHOOK_SECRET=${TG_SECRET}

SESSION_SECRET=${SESSION_SECRET}
ADMIN_SECRET=${ADMIN_SECRET}

REPLIT_DOMAINS=trinityfund.io,api.trinityfund.io
EOF

chmod 600 "${APP_DIR}/.env.production"
info ".env.production written"

# ── PM2 start / reload ────────────────────────────────────────────────────────
section "9. PM2"
set -a; source "${APP_DIR}/.env.production"; set +a

if pm2 describe sx-fund-api &>/dev/null; then
  pm2 reload sx-fund-api
  info "sx-fund-api reloaded"
else
  pm2 start "${APP_DIR}/deploy/ecosystem.config.cjs" --env production
  info "sx-fund-api started"
fi

pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true
info "PM2 startup configured"

# ── Nginx ─────────────────────────────────────────────────────────────────────
section "10. Nginx"
cp "${APP_DIR}/deploy/nginx-http.conf" /etc/nginx/sites-available/sxfund
ln -sf /etc/nginx/sites-available/sxfund /etc/nginx/sites-enabled/sxfund
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl enable --now nginx && systemctl reload nginx
info "Nginx running on port 80"

# ── Smoke test ────────────────────────────────────────────────────────────────
section "11. Smoke test"
sleep 2
HEALTH=$(curl -sf http://localhost/api/healthz 2>/dev/null || echo "FAIL")
if [[ "$HEALTH" == "FAIL" ]]; then
  warn "Health check failed — check logs: pm2 logs sx-fund-api"
else
  info "API healthy: ${HEALTH}"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
section "✅  DONE"
echo ""
echo -e "${GREEN}API server running at:${NC}"
echo -e "  http://$(curl -sf ifconfig.me 2>/dev/null || echo '45.32.158.100')/api/healthz"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Point DNS:  api.trinityfund.io  →  $(curl -sf ifconfig.me 2>/dev/null || echo '45.32.158.100')"
echo "  2. Issue SSL:  certbot --nginx -d api.trinityfund.io"
echo "  3. Set webhook: curl -X POST http://localhost/api/bot/setup-webhook -H 'x-admin-secret: ${ADMIN_SECRET}'"
echo "  4. View logs:  pm2 logs sx-fund-api"
echo ""
