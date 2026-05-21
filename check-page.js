const http = require('http');
http.get('http://localhost:3000/', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Length:', d.length);
    console.log('Has error:', d.indexOf('_error') > -1);
  });
}).on('error', e => console.log('Error:', e.message));
