import { Router } from 'express';
import { VedicCalculator, BirthDetails } from '../engine/calculator';

const router = Router();

router.post('/', (req, res) => {
  try {
    const data: BirthDetails = req.body;

    // Basic validation
    if (!data.date || !data.time || !data.latitude || !data.longitude || !data.timezone) {
      return res.status(400).json({ error: 'Missing required birth details' });
    }

    const chart = VedicCalculator.generateChart(data);
    res.json(chart);
  } catch (error) {
    console.error('Error generating chart:', error);
    res.status(500).json({ error: 'Failed to generate chart' });
  }
});

export default router;

