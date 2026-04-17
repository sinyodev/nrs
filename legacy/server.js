const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'groundrule.html' : req.url);
  const ext = path.extname(filePath);
  const contentTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8' };

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/html; charset=utf-8' });
    res.end(data);
  });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
