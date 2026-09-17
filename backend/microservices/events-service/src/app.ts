import express from 'express';
import cors from 'cors';
import eventsRoutes from './routes/events';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'events-service' });
});

app.use('/api/events', eventsRoutes);
