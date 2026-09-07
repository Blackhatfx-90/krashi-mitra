'use strict';

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  const key = process.env.OPENWEATHER_API_KEY;
  const lat = Number(req.query?.lat);
  const lon = Number(req.query?.lon);
  if (!key) return res.status(503).json({ error: 'not_configured' });
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) return res.status(400).json({ error: 'invalid_coordinates' });
  const url = 'https://api.openweathermap.org/data/2.5/weather?lat=' + encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lon) + '&units=metric&lang=hi&appid=' + encodeURIComponent(key);
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: 'upstream_error' });
    return res.status(200).json({ city: data.name, temperatureC: data.main?.temp, humidity: data.main?.humidity, windMs: data.wind?.speed, condition: data.weather?.[0]?.description || '', source: 'openweathermap', checkedAt: new Date().toISOString() });
  } catch (_) { return res.status(502).json({ error: 'weather_unavailable' }); }
};
