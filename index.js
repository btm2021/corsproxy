import http from "http";
import https from "https";

const httpsAgent = new https.Agent({ keepAlive: true });
const httpAgent = new http.Agent({ keepAlive: true });

function safeDecode(url) {
  try {
    let d = decodeURIComponent(url);
    // Nếu vẫn còn ký tự %, decode thêm lần nữa
    if (/%[0-9A-F]{2}/i.test(d)) {
      d = decodeURIComponent(d);
    }
    return d;
  } catch {
    return url;
  }
}

const server = http.createServer(async (req, res) => {
  let target = req.url.slice(1);

  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };

  if (req.method === "OPTIONS") {
    res.writeHead(200, CORS);
    return res.end();
  }

  // ✅ FIX: decode encode 1/2 lần của CCXT
  target = safeDecode(target);

  if (!target.startsWith("http")) {
    res.writeHead(400, CORS);
    return res.end("Invalid target URL: " + target);
  }

  try {
    const agent = target.startsWith("https") ? httpsAgent : httpAgent;

    const headers = { ...req.headers };
    delete headers.host;

    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req,
      redirect: "follow",
      // ✅ SỬ DỤNG agent — KHÔNG dùng dispatcher
      agent,
    });

    const ab = await upstream.arrayBuffer();
    const body = Buffer.from(ab);

    const responseHeaders = {};
    upstream.headers.forEach((v, k) => (responseHeaders[k] = v));
    Object.assign(responseHeaders, CORS);

    res.writeHead(upstream.status, responseHeaders);
    res.end(body);
  } catch (err) {
    res.writeHead(500, CORS);
    res.end("Proxy Error: " + err.toString());
  }
});

server.listen(process.env.PORT || 3000);
