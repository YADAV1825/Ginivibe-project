#!/bin/bash
# ─────────────────────────────────────────────────────────────
# TURN Server Setup Script (coturn)
#
# A TURN server relays video/audio for users behind strict NATs
# (symmetric NATs, corporate firewalls, some mobile networks).
# Without it, ~10-20% of WebRTC connections will fail.
#
# Run this script on your cloud server (the same one or a
# separate one — TURN needs a public IP).
# ─────────────────────────────────────────────────────────────

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TURN Server (coturn) Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── Configuration ───────────────────────────────────
TURN_USERNAME="${TURN_USERNAME:-videocall}"
TURN_PASSWORD="${TURN_PASSWORD:-$(openssl rand -hex 16)}"
TURN_PORT="${TURN_PORT:-3478}"
TURN_REALM="${TURN_REALM:-videocall.local}"

# Detect public IP
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "YOUR_PUBLIC_IP")

echo ""
echo "Configuration:"
echo "  Username:  $TURN_USERNAME"
echo "  Password:  $TURN_PASSWORD"
echo "  Port:      $TURN_PORT"
echo "  Realm:     $TURN_REALM"
echo "  Public IP: $PUBLIC_IP"
echo ""

# ─── Install coturn ──────────────────────────────────
echo "[1/4] Installing coturn..."

if command -v apt-get &> /dev/null; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq coturn
elif command -v yum &> /dev/null; then
  sudo yum install -y coturn
elif command -v dnf &> /dev/null; then
  sudo dnf install -y coturn
elif command -v pacman &> /dev/null; then
  sudo pacman -Sy --noconfirm coturn
else
  echo "ERROR: Could not detect package manager. Install coturn manually."
  exit 1
fi

echo "  ✅ coturn installed"

# ─── Configure coturn ────────────────────────────────
echo "[2/4] Configuring coturn..."

sudo tee /etc/turnserver.conf > /dev/null << TURNCONF
# ─── coturn configuration for WebRTC video calling ───

# Network
listening-port=$TURN_PORT
tls-listening-port=5349
listening-ip=0.0.0.0
external-ip=$PUBLIC_IP
relay-ip=0.0.0.0

# Relay ports range (open these in your firewall)
min-port=49152
max-port=65535

# Authentication
realm=$TURN_REALM
server-name=$TURN_REALM
lt-cred-mech
user=$TURN_USERNAME:$TURN_PASSWORD

# Security
fingerprint
no-cli
no-software-attribute
no-multicast-peers

# Logging
log-file=/var/log/turnserver/turnserver.log
simple-log
new-log-timestamp

# Performance
total-quota=100
stale-nonce=600
proc-user=turnserver
proc-group=turnserver

# Deny private/internal IPs from being relayed (security)
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.168.0.0-192.168.255.255

# Optional: TLS (recommended for production)
# cert=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
# pkey=/etc/letsencrypt/live/yourdomain.com/privkey.pem
TURNCONF

echo "  ✅ Configuration written to /etc/turnserver.conf"

# ─── Enable coturn service ───────────────────────────
echo "[3/4] Enabling coturn service..."

# Enable coturn to start as a service
if [ -f /etc/default/coturn ]; then
  sudo sed -i 's/#TURNSERVER_ENABLED=1/TURNSERVER_ENABLED=1/' /etc/default/coturn
fi

# Create log directory
sudo mkdir -p /var/log/turnserver
sudo chown turnserver:turnserver /var/log/turnserver 2>/dev/null || true

sudo systemctl enable coturn
sudo systemctl restart coturn

echo "  ✅ coturn service started"

# ─── Firewall rules ─────────────────────────────────
echo "[4/4] Firewall configuration..."

if command -v ufw &> /dev/null; then
  sudo ufw allow $TURN_PORT/tcp
  sudo ufw allow $TURN_PORT/udp
  sudo ufw allow 5349/tcp
  sudo ufw allow 5349/udp
  sudo ufw allow 49152:65535/udp
  echo "  ✅ UFW rules added"
elif command -v firewall-cmd &> /dev/null; then
  sudo firewall-cmd --permanent --add-port=$TURN_PORT/tcp
  sudo firewall-cmd --permanent --add-port=$TURN_PORT/udp
  sudo firewall-cmd --permanent --add-port=5349/tcp
  sudo firewall-cmd --permanent --add-port=5349/udp
  sudo firewall-cmd --permanent --add-port=49152-65535/udp
  sudo firewall-cmd --reload
  echo "  ✅ Firewall rules added"
else
  echo "  ⚠️  No firewall tool detected. Manually open ports: $TURN_PORT (TCP/UDP), 5349 (TCP/UDP), 49152-65535 (UDP)"
fi

# ─── Output .env values ─────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ TURN Server Ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Add these to your video-call-server .env file:"
echo ""
echo "  TURN_SERVER=turn:$PUBLIC_IP:$TURN_PORT"
echo "  TURN_USERNAME=$TURN_USERNAME"
echo "  TURN_CREDENTIAL=$TURN_PASSWORD"
echo ""
echo "Test with: turnutils_uclient -u $TURN_USERNAME -w $TURN_PASSWORD $PUBLIC_IP"
echo ""
echo "Logs: /var/log/turnserver/turnserver.log"
echo "Config: /etc/turnserver.conf"
echo ""

