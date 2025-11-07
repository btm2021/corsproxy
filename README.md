# CORS Proxy cho CCXT

CORS proxy đơn giản để sử dụng với thư viện CCXT, deploy trên Koyeb.

## Cách sử dụng

Thư viện CCXT sẽ gọi proxy theo format:
```
https://your-app.koyeb.app/<encoded-url>
```

Ví dụ:
```
https://regional-nicole-mycop-df54b780.koyeb.app/https%3A%2F%2Fopen-api.bingx.com%2FopenApi%2Fswap%2Fv2%2Fquote%2Fcontracts%3Ftimestamp%3D1762546874044
```

## Deploy lên Koyeb

1. Push code lên GitHub repository
2. Tạo app mới trên Koyeb
3. Connect với GitHub repository
4. Chọn build type: **Buildpack**
5. Port: **8000** (hoặc để Koyeb tự detect)
6. Deploy!

## Local Development

```bash
npm install
npm start
```

Server sẽ chạy tại `http://localhost:8000`

## Test

```bash
curl "http://localhost:8000/https%3A%2F%2Fapi.example.com%2Fdata"
```
