import http from "http";
import https from "https";

const httpsAgent = new https.Agent({ keepAlive: true });
const httpAgent = new http.Agent({ keepAlive: true });

const server = http.createServer(async (req, res) => {
  let target = req.url.slice(1); // remove "/"

  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Credentials": "true",
  };

  // ✅ Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(200, CORS);
    return res.end();
  }

  // ✅ FIX URL encode từ CCXT
  try {
    target = decodeURIComponent(target);
  } catch (err) {
    res.writeHead(400, CORS);
    return res.end("Invalid Encoded URL");
  }

  // ✅ Validate URL
  if (!target.startsWith("http")) {
    res.writeHead(400, CORS);
    return res.end("Invalid target URL: " + target);
  }

  try {
    const headers = { ...req.headers };
    delete headers["host"];

    const agent = target.startsWith("https") ? httpsAgent : httpAgent;

    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req,
      redirect: "follow",
      dispatcher: agent,
    });

    const ab = await upstream.arrayBuffer();
    const body = Buffer.from(ab);

    const responseHeaders = {};
    upstream.headers.forEach((v, k) => (responseHeaders[k] = v));

    Object.assign(responseHeaders, CORS);

    res.writeHead(upstream.status, responseHeaders);
    return res.end(body);
  } catch (error) {
    res.writeHead(500, CORS);
    return res.end("Proxy Error: " + error.toString());
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("CORS Proxy running on port " + PORT);
});
