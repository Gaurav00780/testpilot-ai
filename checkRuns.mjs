fetch('http://localhost:3001/api/v1/runs')
  .then(r => r.json())
  .then(d => {
    const runs = d.runs.slice(0, 5);
    runs.forEach(r => {
      console.log('---');
      console.log('Run:', r.id.slice(0, 8), '| Status:', r.status, '| URL:', r.url);
      console.log('AI Analysis enabled:', r.aiAnalysis);
      (r.browserResults || []).forEach(b => {
        console.log('  Browser:', b.browser, '| Mismatch:', b.mismatchPercent);
        console.log('  aiIssues:', b.aiIssues ? b.aiIssues.length : 'none');
        console.log('  aiSummary:', (b.aiSummary || '').slice(0, 80));
      });
    });
  })
  .catch(e => console.error('Error:', e.message));
