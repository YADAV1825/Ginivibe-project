import { Router } from 'express';
import { ChartJSON, VedicCalculator, BirthDetails } from '../engine/calculator';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const birthDetails = req.body as BirthDetails;

    if (!birthDetails || !birthDetails.date || !birthDetails.time || !birthDetails.latitude || !birthDetails.longitude) {
      return res.status(400).json({ error: 'Missing or invalid birth details' });
    }

    // Securely calculate the chart on the backend to prevent prompt injection
    const chartData = VedicCalculator.generateChart(birthDetails);

    const museApiKey = process.env.MUSE_SPARK_API;
    const isMuse = !!museApiKey;
    const apiKey = isMuse ? museApiKey : process.env.OPENROUTER_API_KEY;
    const apiUrl = isMuse ? 'https://api.meta.ai/v1/chat/completions' : (process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions');
    const model = isMuse ? 'muse-spark-1.3-contributor' : (process.env.OPENROUTER_MODEL || 'nex-agi/nex-n2.5-pro:free');

    if (!apiKey) {
      return res.status(500).json({ error: 'AI API key not configured' });
    }

    // Construct a comprehensive prompt using the D1 and D9 chart data
    const prompt = `
You are an expert Vedic Astrologer. Analyze the provided D1 (Lagna) and D9 (Navamsa) charts.

Chart Details:
- D1 Ascendant (Lagna): ${chartData.lagna.sign}
- D1 Planets:
${Object.values(chartData.d1.planets).map(p => `  - ${p.planet}: in ${p.sign} (House ${p.house}), ${p.retrograde ? 'Retrograde' : 'Direct'}`).join('\n')}
- D9 Ascendant: ${chartData.d9.houses[1].sign}
- D9 Planets:
${Object.values(chartData.d9.planets).map(p => `  - ${p.planet}: in ${p.sign} (Navamsa ${p.navamsa_number})`).join('\n')}

Please provide a detailed astrological report in pure Markdown format. The report should include: 
1. A brief overview of the chart's main strengths and weaknesses based on the Lagna and its lord.
2. A detailed analysis of all 12 houses. **Format this analysis as a Markdown table.** The table should have columns for House, Sign, Ruler, Planets, and Interpretation.
3. A detailed analysis of key life areas: **Wealth, Career, Luck, Relationships, Health, Family, and Business**. Use bold headers for each section. Do NOT provide numerical scores or arbitrary metrics.

Return ONLY the markdown text. Do not wrap it in JSON. Do not use code blocks around the entire response.
`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are an expert Vedic astrologer. Output ONLY pure Markdown text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        stream: true
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('LLM API Error:', errText);
      return res.status(502).json({ error: 'Failed to communicate with AI provider' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body?.getReader();
    if (!reader) {
      return res.status(500).json({ error: 'Failed to read AI stream' });
    }

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        res.end();
        break;
      }
      res.write(decoder.decode(value, { stream: true }));
    }
  } catch (error) {
    console.error('Error interpreting chart:', error);
    res.status(500).json({ error: 'Failed to interpret chart' });
  }
});

export default router;
