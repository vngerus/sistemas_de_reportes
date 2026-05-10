import fs from 'fs';
const metrics = JSON.parse(fs.readFileSync('src/data/metrics.json', 'utf8'));
const result = {};

for (const [id, ds] of Object.entries(metrics)) {
  const last7 = ds.days.slice(-7);
  const prev7 = ds.days.slice(-14, -7);
  const getSum = (days, key) => days.reduce((sum, d) => sum + (d.metrics[key] || 0), 0);
  const getAvg = (days, key) => getSum(days, key) / days.length;
  
  const keys = ['traffic', 'leads_created', 'deals_won', 'avg_response_time_min', 'support_tickets_opened'];
  result[id] = {};
  
  for (const key of keys) {
    const l = getAvg(last7, key);
    const p = getAvg(prev7, key);
    const delta = p ? ((l - p) / p * 100).toFixed(1) + '%' : 'N/A';
    result[id][key] = { last7: l.toFixed(1), prev7: p.toFixed(1), delta };
  }
}

console.log(JSON.stringify(result, null, 2));
