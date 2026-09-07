'use strict';

const TARGETS = {
  rice: { n: 120, p: 60, k: 40 }, wheat: { n: 120, p: 60, k: 40 }, maize: { n: 120, p: 60, k: 40 },
  cotton: { n: 100, p: 50, k: 50 }, sugarcane: { n: 250, p: 115, k: 115 },
  tomato: { n: 150, p: 80, k: 120 }, potato: { n: 180, p: 80, k: 120 }, onion: { n: 100, p: 50, k: 50 },
  mango: { n: 50, p: 25, k: 50 }, apple: { n: 80, p: 40, k: 80 },
};

function fertilizerRecommendation(crop, plotSize, unit = 'acre') {
  const key = String(crop || '').toLowerCase().trim();
  const size = Number(plotSize);
  if (!Number.isFinite(size) || size <= 0 || size > 100000) throw new Error('invalid_plot_size');
  const acres = unit === 'hectare' ? size * 2.47105 : unit === 'bigha' ? size * 0.625 : unit === 'kanal' ? size * 0.125 : size;
  const target = TARGETS[key] || TARGETS.rice;
  return { crop: key || 'rice', unit, plotSize: size, acres: Number(acres.toFixed(4)), nitrogenKg: Number((target.n * acres).toFixed(2)), phosphorusKg: Number((target.p * acres).toFixed(2)), potassiumKg: Number((target.k * acres).toFixed(2)), basis: 'kg nutrient requirement; confirm with soil test and local agriculture officer' };
}

module.exports = { fertilizerRecommendation, TARGETS }; 
