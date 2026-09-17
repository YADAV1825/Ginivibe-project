import express from 'express';
import cors from 'cors';
import roomsRoutes from './routes/rooms';

export const app = express();

app.use(cors());

// The LiveKit webhook needs the *raw* request body (Buffer) to verify the
// signature, so it gets raw parsing ahead of the JSON parser, scoped to
// exactly that path.
app.use('/api/rooms/webhook/livekit', express.raw({ type: '*/*' }));

app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'rooms-service' });
});

app.use('/api/rooms', roomsRoutes);