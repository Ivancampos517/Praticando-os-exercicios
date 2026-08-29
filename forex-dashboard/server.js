// Tiny static file server + calendar proxy — no npm install needed (uses only
// Node's built-in modules). Run with: node server.js
//
// Why this exists: JBlanked's calendar API doesn't send an
// Access-Control-Allow-Origin header, so browsers block a direct fetch from
// http://localhost:PORT (CORS is a browser-only restriction). This server
// forwards the request instead, since server-to-server calls aren't subject
// to CORS. The API key still lives only in config.js in your browser — this
// proxy just relays whatever Authorization header the page sends.
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function proxyCalendar(req, res) {
  const upstream = https.request(
    'https://www.jblanked.com/news/api/mql5/calendar/today/',
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers['authorization'] || '',
      },
    },
    (upRes) => {
      res.writeHead(upRes.statusCode || 502, { 'Content-Type': 'application/json' });
      upRes.pipe(res);
    }
  );
  upstream.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'proxy_error', message: err.message }));
  });
  upstream.end();
}

function serveStatic(req, res) {
  const urlPath = req.url.split('?')[0];
  const safePath = path.normalize(urlPath === '/' ? '/index.html' : urlPath);
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/calendar')) {
    proxyCalendar(req, res);
  } else {
    serveStatic(req, res);
  }
});

server.listen(PORT, () => {
  console.log(`Serving! Local: http://localhost:${PORT}`);
});
