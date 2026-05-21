const http = require('http');
const fs = require('fs');

// Login with admin/password (from seed)
const loginData = JSON.stringify({username: 'admin', password: 'password'});
const req = http.request({
    hostname: 'localhost', port: 3001, path: '/api/auth/login',
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData)}
}, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        const token = JSON.parse(body).access_token;
        // Get first student
        http.get({hostname: 'localhost', port: 3001, path: '/api/students', headers: {'Authorization': 'Bearer ' + token}}, (res2) => {
            let body2 = '';
            res2.on('data', d => body2 += d);
            res2.on('end', () => {
                const students = JSON.parse(body2);
                const list = Array.isArray(students) ? students : students.data;
                const student = list[0];
                console.log('Student:', student.fullName, '(id:', student.id + ')');
                // Download IEP PDF
                http.get({hostname: 'localhost', port: 3001, path: '/api/reports/iep/' + student.id + '/pdf', headers: {'Authorization': 'Bearer ' + token}}, (res3) => {
                    const chunks = [];
                    res3.on('data', c => chunks.push(c));
                    res3.on('end', () => {
                        const pdf = Buffer.concat(chunks);
                        fs.writeFileSync('test-output.pdf', pdf);
                        console.log('PDF saved: ' + pdf.length + ' bytes');
                    });
                });
            });
        });
    });
});
req.write(loginData);
req.end();
