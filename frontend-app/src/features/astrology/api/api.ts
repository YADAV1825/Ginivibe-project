const API_URL = 'http://localhost:3006/api/astrology';

export const AstrologyApi = {
  searchLocations: async (q: string) => {
    const res = await fetch(`${API_URL}/locations/search?q=${encodeURIComponent(q)}`);
    return res.json();
  },
  generateChart: async (birthDetails: any) => {
    const res = await fetch(`${API_URL}/chart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(birthDetails)
    });
    if (!res.ok) throw new Error('Failed to generate chart');
    return res.json();
  },
  getInterpretation: async (birthDetails: any) => {
    const res = await fetch(`${API_URL}/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(birthDetails)
    });
    if (!res.ok) throw new Error('Failed to get interpretation');
    return res.json();
  }
};
