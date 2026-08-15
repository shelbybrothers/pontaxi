// Static host for the built city — this is what Railway runs.
// Vercel serves dist/ itself and never touches this file.
// No dependencies on purpose: nothing to install, nothing to keep patched.
import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('../dist', import.meta.url)))
const PORT = Number(process.env.PORT) || 8824
const HOST = process.env.HOST || '0.0.0.0'

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

if (!existsSync(ROOT)) {
  console.error(`[pontaxi] no build found at ${ROOT} — run "npm run build" first`)
  process.exit(1)
}

/**
 * Only /assets/* is content-hashed by Vite, so only /assets/* may be immutable.
 * Anything else keeps a stable name and must be revalidated, or a deploy will
 * leave people pinned to the previous build.
 */
const cacheFor = (urlPath) =>
  urlPath.startsWith('/assets/')
    ? 'public, max-age=31536000, immutable'
    : 'no-cache'

const send = (res, status, file, urlPath) => {
  res.writeHead(status, {
    'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': cacheFor(urlPath),
    'X-Content-Type-Options': 'nosniff',
  })
  createReadStream(file).pipe(res)
}

const server = createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end('method not allowed')
    return
  }

  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)

  if (urlPath === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' }).end('ok')
    return
  }

  // normalize() collapses "..", and the prefix test rejects anything that
  // still points outside dist/
  const candidate = resolve(join(ROOT, normalize(urlPath)))
  if (candidate !== ROOT && !candidate.startsWith(ROOT + '/')) {
    res.writeHead(403).end('forbidden')
    return
  }

  if (existsSync(candidate) && statSync(candidate).isFile()) {
    send(res, 200, candidate, urlPath)
    return
  }

  // A missing hashed asset is a genuine 404. Everything else is the city —
  // served with 200, which is what the Vercel rewrite does, so a link that
  // picked up a stray path behaves the same on both hosts.
  if (urlPath.startsWith('/assets/')) {
    res.writeHead(404, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' }).end('not found')
    return
  }
  send(res, 200, join(ROOT, 'index.html'), '/index.html')
})

server.listen(PORT, HOST, () => {
  console.log(`[pontaxi] serving ${ROOT} on http://${HOST}:${PORT}`)
})

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => server.close(() => process.exit(0)))
}
