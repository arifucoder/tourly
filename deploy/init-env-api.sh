#!/usr/bin/env bash
# Creates ~/apps/tourly/.env.api on the VPS from .env.db (never overwrites). Run from your Mac:
#   ssh -i ~/.ssh/tourly_deploy deploy@<VPS_IP> 'bash -s tourly.dev.cv' < deploy/init-env-api.sh
# Then fill in the empty keys: ssh -t ... "nano ~/apps/tourly/.env.api"
set -euo pipefail

DOMAIN="${1:?usage: init-env-api.sh <domain>}"
cd ~/apps/tourly

if [ -f .env.api ]; then
  echo ".env.api already exists — not touching it"
  exit 0
fi
if [ ! -f .env.db ]; then
  echo "Create .env.db first"
  exit 1
fi

set -a
. ./.env.db
set +a

umask 077
cat > .env.api <<EOF
NODE_ENV=production
PORT=5000
TRUST_PROXY_HOPS=2
FRONTEND_URL=https://${DOMAIN}

DB_URL=mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@mongo:27017/tourly?authSource=admin&replicaSet=rs0

JWT_ACCESS_SECRET=$(openssl rand -base64 32)
JWT_ACCESS_EXPIRES=1d
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_EXPIRES=30d
BCRYPT_SALT_ROUND=10

# ---- fill these in ----
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://${DOMAIN}/api/v1/auth/google/callback

SSL_STORE_ID=
SSL_STORE_PASS=
SSL_PAYMENT_API=https://sandbox.sslcommerz.com/gwprocess/v4/api.php
SSL_VALIDATION_API=https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php
SSL_IPN_URL=https://${DOMAIN}/api/v1/payment/validate-payment
SSL_SUCCESS_BACKEND_URL=https://${DOMAIN}/api/v1/payment/success
SSL_FAIL_BACKEND_URL=https://${DOMAIN}/api/v1/payment/fail
SSL_CANCEL_BACKEND_URL=https://${DOMAIN}/api/v1/payment/cancel
SSL_SUCCESS_FRONTEND_URL=https://${DOMAIN}/payment/success
SSL_FAIL_FRONTEND_URL=https://${DOMAIN}/payment/fail
SSL_CANCEL_FRONTEND_URL=https://${DOMAIN}/payment/cancel

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SMTP_HOST=
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
# -----------------------

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}

TOUR_ROLLOVER_ENABLED=true
TOUR_ROLLOVER_CHECK_HOURS=6
TOUR_ROLLOVER_LEAD_DAYS=3
TOUR_ROLLOVER_SPREAD_DAYS=21
SEED_DEMO_PASSWORD=Tourly@2026
UNSPLASH_ACCESS_KEY=
EOF

echo "✓ Created ~/apps/tourly/.env.api for ${DOMAIN} — now fill in the empty keys"
