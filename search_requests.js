const fs = require('fs');
const content = fs.readFileSync('requests.html', 'utf8');
const lines = content.split('\n');
console.log('Total lines:', lines.length);

lines.forEach((l, idx) => {
  if (l.includes('مقبول') || l.includes('approve') || l.includes('status') || l.includes('professionals')) {
    if (l.includes('مقبول ومعتمد') || l.includes('function approve') || l.includes('approve') || l.includes('onSnapshot') || l.includes('renderRequests')) {
      console.log(`L${idx+1}: ${l.trim().substring(0, 120)}`);
    }
  }
});
