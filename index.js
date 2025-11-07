import http from "http";
import https from "https";

const httpsAgent = new https.Agent({ keepAlive: true });
const httpAgent = new http.Agent({ keepAlive: true });

const server = http.createServer(async (req, res) => {
  const target = req.url.slice(1); // remove leading "/"

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

  // ✅ Validate target URL
  if (!target || !target.startsWith("http")) {
    res.writeHead(400, CORS);
    return res.end("Invalid target URL: " + target);
  }

  try {
    // clone headers
    const headers = { ...req.headers };
    delete headers["host"];

    const agent = target.startsWith("https") ? httpsAgent : httpAgent;

    const fetchOptions = {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req,
      redirect: "follow",
      dispatcher: agent, // Node fetch hỗ trợ option này
    };

    // ✅ Fetch upstream
    const upstream = await fetch(target, fetchOptions);

    // Get response body as ArrayBuffer
    const ab = await upstream.arrayBuffer();
    const body = Buffer.from(ab);

    // Copy headers
    const responseHeaders = {};
    upstream.headers.forEach((v, k) => (responseHeaders[k] = v));

    // Add CORS
    Object.assign(responseHeaders, CORS);

    // ✅ Return upstream response
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
