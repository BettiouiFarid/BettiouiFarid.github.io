// Minimal static server for ./site — no dependencies.
// Serves /foo as /foo/index.html (Framer's clean URLs) and 404.html for misses.
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "site");
const port = Number(process.env.PORT) || 3000;

const types = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".mp4": "video/mp4",
};

function resolve(urlPath) {
  const clean = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const file = path.join(root, clean);
  if (!file.startsWith(root)) return null;
  for (const candidate of [file, path.join(file, "index.html"), file + ".html"]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

http
  .createServer((req, res) => {
    const urlPath = req.url.split("?")[0];
    const file = resolve(urlPath);
    if (!file) {
      res.writeHead(404, { "Content-Type": types[".html"] });
      return fs.createReadStream(path.join(root, "404.html")).pipe(res);
    }
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => console.log(`Serving site at http://localhost:${port}`));
