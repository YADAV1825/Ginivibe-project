import { Router } from 'express';
import { Country, State, City } from 'country-state-city';

const router = Router();

router.get('/search', (req, res) => {
  const q = (req.query.q as string) || '';
  if (!q || q.length < 3) return res.json([]);
  
  const cities = City.getAllCities();
  const filtered = cities
    .filter(c => c.name.toLowerCase().startsWith(q.toLowerCase()))
    .slice(0, 20)
    .map(c => {
      const s = State.getStateByCodeAndCountry(c.stateCode, c.countryCode);
      const co = Country.getCountryByCode(c.countryCode);
      return { 
        name: c.name, 
        state: s ? s.name : c.stateCode, 
        country: co ? co.name : c.countryCode, 
        lat: c.latitude, 
        lng: c.longitude 
      };
    });
  res.json(filtered);
});

router.get('/countries', (req, res) => {
  const countries = Country.getAllCountries().map(c => ({
    isoCode: c.isoCode,
    name: c.name,
    phonecode: c.phonecode,
  }));
  res.json(countries);
});

router.get('/states/:countryCode', (req, res) => {
  const states = State.getStatesOfCountry(req.params.countryCode).map(s => ({
    isoCode: s.isoCode,
    name: s.name,
    countryCode: s.countryCode
  }));
  res.json(states);
});

router.get('/cities/:countryCode/:stateCode', (req, res) => {
  const cities = City.getCitiesOfState(req.params.countryCode, req.params.stateCode).map(c => ({
    name: c.name,
    stateCode: c.stateCode,
    countryCode: c.countryCode,
    latitude: c.latitude,
    longitude: c.longitude,
  }));
  res.json(cities);
});

export default router;
