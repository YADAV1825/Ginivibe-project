#!/bin/bash
# ─────────────────────────────────────────────────────────────
# SSL Certificate Setup Script
#
# Option 1: Let's Encrypt (production — needs a domain + public server)
# Option 2: Self-signed (development/testing)
#
# Usage:
#   ./setup-ssl.sh letsencrypt yourdomain.com
#   ./setup-ssl.sh selfsigned
# ─────────────────────────────────────────────────────────────

set -e

CERT_DIR="$(dirname "$0")/../certs"
mkdir -p "$CERT_DIR"

MODE="${1:-selfsigned}"
DOMAIN="${2:-localhost}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SSL Certificate Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$MODE" == "letsencrypt" ]; then
  # ─── Let's Encrypt (Production) ────────────────────
  echo "Mode: Let's Encrypt (production)"
  echo "Domain: $DOMAIN"
  echo ""

  # Install certbot if not present
  if ! command -v certbot &> /dev/null; then
    echo "[1/3] Installing certbot..."
    if command -v apt-get &> /dev/null; then
      sudo apt-get update -qq
      sudo apt-get install -y -qq certbot
    elif command -v yum &> /dev/null; then
      sudo yum install -y certbot
    elif command -v dnf &> /dev/null; then
      sudo dnf install -y certbot
    else
      echo "ERROR: Install certbot manually: https://certbot.eff.org/"
      exit 1
    fi
  else
    echo "[1/3] certbot already installed ✅"
  fi

  # Get certificate
  echo "[2/3] Requesting certificate for $DOMAIN..."
  sudo certbot certonly --standalone \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --register-unsafely-without-email \
    --preferred-challenges http

  # Copy certs to our directory
  echo "[3/3] Setting up certificates..."
  sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CERT_DIR/cert.pem"
  sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$CERT_DIR/key.pem"
  sudo chmod 644 "$CERT_DIR/cert.pem"
  sudo chmod 600 "$CERT_DIR/key.pem"

  # Set up auto-renewal
  echo ""
  echo "Setting up auto-renewal cron job..."
  (sudo crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $CERT_DIR/cert.pem && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $CERT_DIR/key.pem && systemctl reload video-call-server 2>/dev/null || true") | sudo crontab -

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ✅ Let's Encrypt Certificate Ready!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Add to your .env:"
  echo "  SSL_CERT_PATH=$CERT_DIR/cert.pem"
  echo "  SSL_KEY_PATH=$CERT_DIR/key.pem"
  echo ""
  echo "Auto-renewal is configured (runs daily at 3 AM)"
  echo ""

elif [ "$MODE" == "selfsigned" ]; then
  # ─── Self-Signed (Development) ─────────────────────
  echo "Mode: Self-signed (development)"
  echo ""

  if [ -f "$CERT_DIR/cert.pem" ] && [ -f "$CERT_DIR/key.pem" ]; then
    echo "Certificates already exist in $CERT_DIR"
    echo "Delete them first if you want to regenerate."
  else
    echo "Generating self-signed certificate..."
    openssl req -x509 \
      -newkey rsa:2048 \
      -keyout "$CERT_DIR/key.pem" \
      -out "$CERT_DIR/cert.pem" \
      -days 365 \
      -nodes \
      -subj "/C=IN/ST=Dev/L=Local/O=VideoCall/CN=localhost" \
      -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:0.0.0.0" \
      2>/dev/null

    echo "  ✅ Self-signed certificate generated"
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ✅ Self-Signed Certificate Ready!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Add to your .env:"
  echo "  SSL_CERT_PATH=$CERT_DIR/cert.pem"
  echo "  SSL_KEY_PATH=$CERT_DIR/key.pem"
  echo ""
  echo "⚠️  Browsers will show a security warning for self-signed certs."
  echo "   Click 'Advanced' → 'Proceed' to accept it."
  echo "   For production, use: ./setup-ssl.sh letsencrypt yourdomain.com"
  echo ""

else
  echo "Usage:"
  echo "  $0 selfsigned              # Development (self-signed)"
  echo "  $0 letsencrypt domain.com  # Production (Let's Encrypt)"
  exit 1
fi
