import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'astrology-microservice' });
});

import chartRoutes from './routes/chart';
import locationsRoutes from './routes/locations';
import interpretRoutes from './routes/interpret';

app.use('/api/astrology/chart', chartRoutes);
app.use('/api/astrology/locations', locationsRoutes);
app.use('/api/astrology/interpret', interpretRoutes);

const PORT = process.env.PORT || 3006;

app.listen(PORT, () => {
  console.log(`Astrology microservice running on port ${PORT}`);
});

// Keep event loop alive for Node 24 + tsx bug
setInterval(() => {}, 1000 * 60 * 60);
