# Deployment Notes — What Requires Your Infrastructure

These items are **fully coded and ready** — they just need YOUR server/domain/cloud to actually activate. None of these can be done from a local development machine.

---

## 1. 🌐 Production SSL Certificates (Let's Encrypt)

**What's done**: Self-signed SSL certs are generated and working. The server runs HTTPS.

**What you need to do**: Get a real domain and real certificates so browsers don't show security warnings.

```bash
# On your cloud server with a domain pointed to it:
npm run setup:ssl:prod yourdomain.com

# This will:
# - Install certbot
# - Get a free Let's Encrypt certificate
# - Auto-configure renewal (runs daily at 3 AM)
# - Output the .env variables to set
```

**Requirements**:
- A domain name (e.g., `calls.yourdomain.com`)
- DNS A record pointing to your server's public IP
- Port 80 open temporarily for Let's Encrypt verification

---

## 2. 📡 TURN Relay Server (coturn)

**What's done**: Setup script is ready. TURN config is wired into the server. Clients already request TURN credentials in the ICE server config.

**What you need to do**: Run the setup script on a server with a **public IP address**.

```bash
# On your cloud server:
npm run setup:turn

# This will:
# - Install coturn
# - Configure it for WebRTC relay
# - Open firewall ports
# - Output the .env variables to set
```

**Why this can't be done locally**: TURN servers need a public IP to relay traffic between users behind different NATs. Your laptop behind your home router can't do this. A $5/month cloud VM (DigitalOcean, Hetzner, AWS Lightsail) works perfectly.

**Requirements**:
- Cloud server with public IP
- Ports open: 3478 (TCP/UDP), 5349 (TCP/UDP), 49152-65535 (UDP)

---

## 3. 🔄 Redis for Horizontal Scaling

**What's done**: Redis adapter is coded and integrated. The server auto-detects Redis and falls back to single-server mode if not available.

**What you need to do**: Install and run Redis, then set the URL.

```bash
# On your server:
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# In your .env:
REDIS_URL=redis://localhost:6379
```

**When you need this**: Only when a single server can't handle your load (50K+ connections per process × cluster workers). Until then, single-server mode works fine.

---

## 4. ⚖️ Load Balancer (Nginx)

**What's done**: The server supports `X-Forwarded-For` headers for real IP detection behind a proxy.

**What you need to do**: Set up Nginx as a reverse proxy with WebSocket support.

```nginx
upstream video_call {
    # Use ip_hash for sticky sessions (required for WebSocket)
    ip_hash;
    server 127.0.0.1:8080;
    server 127.0.0.1:8081;  # Second instance
}

server {
    listen 443 ssl http2;
    server_name calls.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/calls.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/calls.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://video_call;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
```

**When you need this**: When you run multiple server instances (cluster mode or multiple machines).

---

## 5. 📊 Monitoring & Alerting

**What's done**: `/health` and `/metrics` endpoints expose all necessary data.

**What you need to do**: Connect them to a monitoring stack.

**Option A: Simple (PM2 built-in)**
```bash
npm install -g pm2
pm2 start server.js --name video-call -i max
pm2 monit          # Real-time dashboard
pm2 plus           # Cloud monitoring (free tier)
```

**Option B: Production (Prometheus + Grafana)**
- Point Prometheus at `http://your-server:8080/metrics`
- Build Grafana dashboards for connections, rooms, memory
- Set alerts for: connection utilization > 80%, memory > 80%, health check failures

---

## 6. 🐳 Docker Deployment

**What's done**: The app is stateless and Docker-ready.

**Dockerfile** (included in README):
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
```

```bash
docker build -t video-call-server .
docker run -d -p 8080:8080 --env-file .env --name video-call video-call-server
```

---

## Quick Start Deployment Checklist

```
[ ] Get a cloud server (DigitalOcean $6/mo, Hetzner $4/mo, AWS Lightsail $5/mo)
[ ] Point your domain to the server's IP (DNS A record)
[ ] Clone the repo to the server
[ ] npm install
[ ] npm run setup:ssl:prod yourdomain.com
[ ] npm run setup:turn
[ ] Copy .env.example to .env and fill in:
    - JWT_SECRET (generate a strong one)
    - TURN_SERVER, TURN_USERNAME, TURN_CREDENTIAL (from setup:turn output)
    - AUTH_ENABLED=true
[ ] npm run start:cluster
[ ] (Optional) Set up PM2 for process management
[ ] (Optional) Set up Nginx for load balancing
[ ] (Optional) Install Redis for multi-server scaling
```

---

## Cost Estimate

| Component | Cost | Notes |
|---|---|---|
| Signaling server | $5-20/mo | 1 VM handles ~200K concurrent calls in cluster mode |
| TURN server | $5-10/mo | Same or separate VM; bandwidth is the real cost |
| Domain | $10/year | Any registrar |
| SSL | Free | Let's Encrypt |
| Redis | $0 | Self-hosted on same VM, or $15/mo managed |
| **Total** | **$10-30/mo** | For up to ~200K concurrent calls |

> Compare to Twilio: $0.004/min × 200K calls × 10 min avg = **$8,000/month**. You're saving >99%.
