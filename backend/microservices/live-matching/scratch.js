const WebSocket = require('ws');

const ws1 = new WebSocket('wss://localhost:8080/?token=fake', { rejectUnauthorized: false });
const ws2 = new WebSocket('wss://localhost:8080/?token=fake', { rejectUnauthorized: false });

const roomCode = 'ROOM_TEST123';

ws1.on('open', () => {
  console.log('WS1 connected');
  ws1.send(JSON.stringify({ type: 'join-room', roomCode }));
});

ws1.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log('WS1 received:', msg.type);
  if (msg.type === 'room-joined') {
    if (ws2.readyState === WebSocket.OPEN) {
      console.log('WS2 already connected');
      ws2.send(JSON.stringify({ type: 'join-room', roomCode }));
    } else {
      ws2.on('open', () => {
        console.log('WS2 connected');
        ws2.send(JSON.stringify({ type: 'join-room', roomCode }));
      });
    }
  }
});

ws2.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log('WS2 received:', msg.type);
});

setTimeout(() => {
  ws1.close();
  ws2.close();
  process.exit(0);
}, 2000);
