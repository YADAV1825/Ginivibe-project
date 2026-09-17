# 📹 Video Call Signaling Server

A production-grade, self-hosted video calling backend using **WebRTC** (peer-to-peer) and **WebSocket** signaling. No third-party APIs. No per-minute costs. Your server, your rules.

## Architecture

```
┌─────────────┐      WebSocket       ┌──────────────────┐      WebSocket       ┌─────────────┐
│   User A    │ ◄──── signaling ────► │  Your Server     │ ◄──── signaling ────► │   User B    │
│  (Browser)  │                       │  (Node.js)       │                       │  (Browser)  │
│             │ ◄═══════════════════════ WebRTC P2P ════════════════════════════► │             │
│             │    Video/Audio goes                                               │             │
│             │    DIRECTLY between                                               │             │
│             │    users (not through                                             │             │
└─────────────┘    your server)                                                  └─────────────┘
```

**Your server only handles signaling** — tiny JSON messages to help peers discover each other and exchange connection info. The actual video/audio goes peer-to-peer. This means minimal bandwidth even with thousands of concurrent calls.

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or in dev mode (auto-restart on changes)
npm run dev
```

Open `http://localhost:8080/client/` in **two browser tabs** to test.

## Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `ws://host:8080` | WebSocket | Signaling endpoint |
| `/health` | GET | Health check |
| `/metrics` | GET | Active rooms, connections, queue size, memory |
| `/room/:code/exists` | GET | Check if a room exists and is joinable |
| `/client/` | GET | Test frontend |

## WebSocket Protocol

### Client → Server

```json
{ "type": "join-queue" }                             // Join random matching queue
{ "type": "leave-queue" }                            // Leave the queue
{ "type": "create-room" }                            // Create a room (get code back)
{ "type": "join-room", "roomCode": "ABC123" }        // Join room by code
{ "type": "offer", "sdp": { ... } }                 // SDP offer (forwarded to peer)
{ "type": "answer", "sdp": { ... } }                // SDP answer (forwarded to peer)
{ "type": "ice-candidate", "candidate": { ... } }   // ICE candidate (forwarded to peer)
{ "type": "end-call" }                              // End the call
```

### Server → Client

```json
{ "type": "welcome", "userId": "...", "iceServers": [...] }
{ "type": "matched", "roomCode": "ABC123", "isInitiator": true }
{ "type": "room-created", "roomCode": "ABC123" }
{ "type": "room-joined", "roomCode": "ABC123" }
{ "type": "queue-joined", "position": 1 }
{ "type": "offer", "sdp": { ... } }
{ "type": "answer", "sdp": { ... } }
{ "type": "ice-candidate", "candidate": { ... } }
{ "type": "peer-disconnected", "reason": "call-ended" | "connection-lost" }
{ "type": "call-ended" }
{ "type": "error", "message": "..." }
```

## Next.js / React Integration

### 1. Copy the client library

Copy `client/VideoCallClient.js` into your project (e.g., `lib/VideoCallClient.js`).

### 2. Use in a React component

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import VideoCallClient from '@/lib/VideoCallClient';

export default function VideoCall() {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const clientRef = useRef<VideoCallClient | null>(null);
  const [inCall, setInCall] = useState(false);

  useEffect(() => {
    const client = new VideoCallClient('ws://your-server:8080');
    clientRef.current = client;

    client
      .on('localStream', (stream) => {
        if (localRef.current) localRef.current.srcObject = stream;
      })
      .on('remoteStream', (stream) => {
        if (remoteRef.current) remoteRef.current.srcObject = stream;
      })
      .on('callStarted', () => setInCall(true))
      .on('callEnded', () => setInCall(false))
      .on('peerDisconnected', () => setInCall(false));

    async function init() {
      await client.start();
      await client.connect();
    }
    init();

    return () => client.disconnect();
  }, []);

  return (
    <div>
      <video ref={localRef} autoPlay muted playsInline />
      <video ref={remoteRef} autoPlay playsInline />
      {!inCall ? (
        <button onClick={() => clientRef.current?.findMatch()}>
          Find Match
        </button>
      ) : (
        <button onClick={() => clientRef.current?.endCall()}>
          End Call
        </button>
      )}
    </div>
  );
}
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|---|---|---|
| `PORT` | 8080 | HTTP/WebSocket port |
| `HOST` | 0.0.0.0 | Bind address |
| `MAX_CONNECTIONS_PER_IP` | 5 | Max WebSocket connections per IP |
| `MESSAGE_RATE_LIMIT` | 20 | Max messages per second per client |
| `HEARTBEAT_INTERVAL_MS` | 30000 | Ping interval for dead connection detection |
| `STUN_SERVERS` | Google STUN | Comma-separated STUN server URLs |
| `TURN_SERVER` | (none) | TURN server URL for strict NAT traversal |
| `TURN_USERNAME` | (none) | TURN credentials |
| `TURN_CREDENTIAL` | (none) | TURN credentials |
| `ALLOWED_ORIGINS` | (any) | Comma-separated allowed origins |
| `LOG_LEVEL` | info | Logging level: error, warn, info, debug |

## Production Deployment

### With PM2

```bash
npm install -g pm2
pm2 start server.js --name video-call -i max
pm2 save
pm2 startup
```

### With Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
```

### Nginx Reverse Proxy

```nginx
upstream video_call {
    server 127.0.0.1:8080;
}

server {
    listen 443 ssl http2;
    server_name calls.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://video_call;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }
}
```

## TURN Server (for production)

For users behind strict NATs/firewalls, you'll need a TURN relay server. Install `coturn`:

```bash
# Ubuntu/Debian
sudo apt install coturn

# Configure /etc/turnserver.conf
listening-port=3478
realm=yourdomain.com
server-name=yourdomain.com
lt-cred-mech
user=your-username:your-password
fingerprint
no-cli

# Start
sudo systemctl enable coturn
sudo systemctl start coturn
```

Then set in your `.env`:
```
TURN_SERVER=turn:yourdomain.com:3478
TURN_USERNAME=your-username
TURN_CREDENTIAL=your-password
```

## License

MIT
