const express = require('express');
const http = require('http');
const router = express.Router();

const FLASK_PORT = process.env.GAANA_FLASK_PORT || 5001;

router.get('/', (req, res) => {
  const { url, lyrics } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing required parameter: url' });
  }

  if (!url.includes('gaana.com')) {
    return res.status(400).json({ error: 'URL must be a Gaana.com link' });
  }

  const flaskPath = `/api/gaana?url=${encodeURIComponent(url)}${lyrics ? '&lyrics=true' : ''}`;

  const options = {
    hostname: '127.0.0.1',
    port: FLASK_PORT,
    path: flaskPath,
    method: 'GET',
    timeout: 60000,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => { data += chunk; });
    proxyRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        res.status(proxyRes.statusCode).json(parsed);
      } catch {
        res.status(502).json({ error: 'Invalid response from Gaana service' });
      }
    });
  });

  proxyReq.on('error', (err) => {
    console.error('Gaana proxy error:', err.message);
    res.status(502).json({
      error: 'Gaana service unavailable. Make sure the Flask microservice is running on port ' + FLASK_PORT,
    });
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    res.status(504).json({ error: 'Gaana service timed out' });
  });

  proxyReq.end();
});

module.exports = router;
