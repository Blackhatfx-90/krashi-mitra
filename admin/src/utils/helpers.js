export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export function generateQRCells() {
  const cells = [];
  for (let i = 0; i < 81; i++) {
    cells.push(Math.random() > 0.45 ? 'filled' : 'empty');
  }
  // Ensure corners have the finder patterns
  const corners = [0, 1, 2, 9, 10, 11, 18, 19, 20, 6, 7, 8, 15, 16, 17, 24, 25, 26, 54, 55, 56, 63, 64, 65, 72, 73, 74];
  corners.forEach(i => { if (i < 81) cells[i] = 'filled'; });
  return cells;
}

export function mockAIAnalysis() {
  return {
    findings: [
      { area: 'Chest Region', status: 'Normal', confidence: '95%' },
      { area: 'Lung Fields', status: 'Minor opacity detected in right lower lobe', confidence: '78%' },
      { area: 'Heart Size', status: 'Within normal limits', confidence: '92%' },
      { area: 'Bone Structure', status: 'No fractures detected', confidence: '97%' },
    ],
    summary: 'The scan analysis reveals a minor opacity in the right lower lobe of the lung, which could indicate early-stage pneumonia or minor inflammation. Heart size and bone structure appear normal. A follow-up with a pulmonologist is recommended for further evaluation.',
    anomalies: ['Minor opacity in right lower lobe (78% confidence)'],
    recommendations: [
      'Consult with a pulmonologist within the next 7 days',
      'Consider a follow-up CT scan in 2-3 weeks',
      'Monitor for symptoms: cough, fever, shortness of breath',
      'Maintain adequate hydration and rest',
    ],
    severity: 'Low-Medium',
  };
}

export function generateDietResponse(conditions) {
  const responses = [
    `Based on your conditions (${conditions.join(', ')}), I've prepared a personalized diet plan. This plan focuses on managing blood sugar levels, reducing inflammation, and maintaining optimal nutrition.`,
    `I've analyzed your health profile and created a comprehensive 7-day meal plan. The diet emphasizes whole grains, lean proteins, and fiber-rich foods while minimizing processed sugars and saturated fats.`,
    `Your personalized nutrition plan is ready! Given your conditions, I recommend a DASH-inspired diet with modifications for your specific needs. Let me walk you through the weekly plan.`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}
