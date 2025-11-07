import express from 'express';
import cors from 'cors';
import { createGzip } from 'zlib';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS cho tất cả requests
app.use(cors());

// Middleware BẮT BUỘC GZIP cho mọi response
app.use((req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;

  // Override res.send để luôn gzip
  res.send = function (data) {
    if (res.headersSent) {
      return originalSend.call(this, data);
    }

    res.setHeader('Content-Encoding', 'gzip');
    res.removeHeader('Content-Length');

    const gzip = createGzip();
    gzip.pipe(res);
    gzip.end(Buffer.from(data));
  };

  // Override res.json để luôn gzip
  res.json = function (data) {
    if (res.headersSent) {
      return originalJson.call(this, data);
    }

    const jsonString = JSON.stringify(data);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Encoding', 'gzip');
    res.removeHeader('Content-Length');

    const gzip = createGzip();
    gzip.pipe(res);
    gzip.end(Buffer.from(jsonString));
  };

  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CORS Proxy for CCXT is running (GZIP forced)',
    usage: 'GET /<encoded-url>'
  });
});

// CORS proxy endpoint
app.get('/*', async (req, res) => {
  try {
    // Lấy URL từ path (bỏ dấu / đầu tiên)
    const targetUrl = decodeURIComponent(req.url.slice(1));
    
    if (!targetUrl || !targetUrl.startsWith('http')) {
      return res.status(400).json({ 
        error: 'Invalid URL',
        message: 'Please provide a valid encoded URL'
      });
    }

    // Forward request đến target URL
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CCXT-Proxy/1.0)',
        'Accept': 'application/json, text/plain, */*'
      }
    });

    // Copy response headers
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Forward response - sẽ tự động được gzip bởi middleware
    const data = await response.text();
    res.status(response.status).send(data);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy error',
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`CORS Proxy server running on port ${PORT} with forced GZIP`);
});
