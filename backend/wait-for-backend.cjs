const http = require('http');

function check(maxAttempts) {
    const req = http.get('http://localhost:3001/api/health', (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
            console.log('Backend is ready! Response:', body);
            process.exit(0);
        });
    });
    req.on('error', (err) => {
        const attempt = maxAttempts - 1;
        if (attempt <= 0) {
            console.log('Backend not ready after all attempts');
            process.exit(1);
        }
        console.log('Waiting for backend... attempt', 10 - attempt);
        setTimeout(() => check(attempt), 3000);
    });
    req.end();
}

check(10);
