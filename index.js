import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS cho tất cả requests
app.use(cors());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CORS Proxy for CCXT is running',
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
        'User-Agent': 'Mozilla/5.0',
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

    // Forward response
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
  console.log(`CORS Proxy server running on port ${PORT}`);
});
``