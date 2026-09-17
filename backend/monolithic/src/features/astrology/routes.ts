import { Router } from 'express';

const router = Router();

router.get('/locations/search', (req, res) => {
  const q = (req.query.q as string || '').toLowerCase();
  
  // Mock city database
  const cities = [
    { name: 'Pataudi', state: 'Haryana', country: 'India', lat: '28.3225', lng: '76.7821' },
    { name: 'Paris', state: 'Ile-de-France', country: 'France', lat: '48.8566', lng: '2.3522' },
    { name: 'Palo Alto', state: 'California', country: 'USA', lat: '37.4419', lng: '-122.1430' },
    { name: 'New York', state: 'New York', country: 'USA', lat: '40.7128', lng: '-74.0060' },
    { name: 'London', state: 'England', country: 'UK', lat: '51.5074', lng: '-0.1278' },
    { name: 'Tokyo', state: 'Tokyo', country: 'Japan', lat: '35.6762', lng: '139.6503' }
  ];

  const results = cities.filter(c => c.name.toLowerCase().includes(q));
  res.json(results);
});

router.post('/chart', (req, res) => {
  // Mock generated chart data
  res.json({
    sunSign: 'Aries',
    moonSign: 'Taurus',
    ascendant: 'Gemini',
    houses: [
      { house: 1, sign: 'Gemini', planets: [] },
      { house: 2, sign: 'Cancer', planets: ['Moon'] },
      { house: 10, sign: 'Pisces', planets: ['Sun', 'Mercury'] }
    ]
  });
});

router.post('/interpret', (req, res) => {
  // Mock interpretation data
  res.json({
    interpretation: 'Based on the alignment of the stars at your birth location, you have a strong drive for leadership (Aries Sun) but seek stability in your emotional life (Taurus Moon). The Gemini Ascendant gives you a curious and adaptable approach to the world.'
  });
});

export default router;
