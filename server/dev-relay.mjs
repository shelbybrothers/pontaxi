// Standalone realm for local development, so `npm run dev` (Vite on 5824) and
// the relay can run side by side. In production the realm rides along on the
// static server instead — see server/index.mjs.
import { createServer } from 'node:http'
import { attachRealm, REALM_PATH } from './realm.mjs'

const PORT = Number(process.env.REALM_PORT) || 8826
const HOST = process.env.HOST || '0.0.0.0'

const server = createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' }).end('ok')
    return
  }
  res.writeHead(404).end('realm only')
})

attachRealm(server)

server.listen(PORT, HOST, () => {
  console.log(`[realm] listening on ws://${HOST}:${PORT}${REALM_PATH}`)
})

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => server.close(() => process.exit(0)))
}
