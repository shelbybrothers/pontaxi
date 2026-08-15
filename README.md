# pontaxi.fun

A small city with a taxi company in it. Walk the streets, talk to whoever is
standing around, and go inside any building with a sign over the door.

**[@pontaxi](https://x.com/pontaxi)**

Everything you see — roads, buildings, the fountain, the cabs, everyone walking
around — is boxes generated in the browser when the page opens. No models, no
textures, no asset downloads.

## Run it

```bash
npm install
npm run dev      # http://localhost:5824
```

| script | what it does |
| --- | --- |
| `npm run dev` | Vite dev server on :5824 |
| `npm run build` | production build into `dist/` |
| `npm run preview` | serve the build on :5825 |
| `npm start` | serve `dist/` with the bundled Node server (what Railway runs) |
| `npm run verify` | headless checks on the generated city |
| `npm run check` | `verify` then `build` |

`npm run verify` is the useful one. It regenerates the city in plain Node and
asserts the things a screenshot cannot show you: no two buildings overlap, no
building spills onto a carriageway, every door is standable, no window is buried
inside a facade, and nobody spawns inside a lobby.

## Layout

```
src/data/city.js      the generator — grid, blocks, buildings, windows, props
src/data/content.js   all copy: the six buildings and the locals
src/world/            three.js scene: city, player, crowd, traffic, interiors
src/ui/               landing page and in-game HUD
src/lib/pixelfont.jsx 5x7 bitmap font drawn as SVG rects (the wordmark)
server/index.mjs      dependency-free static host for Railway
scripts/verify.mjs    the city checks
```

## Deploying

The site is fully static. **Vercel alone is enough** — Railway is only worth
wiring up if you want a second host, or if a server (a multiplayer relay, an
API) gets added later and needs somewhere to live.

You cannot point `pontaxi.fun` at both. Pick one for the apex — Vercel is the
better fit for static — and give the other a subdomain if you want it reachable.

### Vercel

The repo is private, so Vercel's GitHub App has to be granted access to it
before the repo will appear in the import list.

1. **vercel.com → Add New → Project**.
2. Under *Import Git Repository*, find `shelbybrothers/pontaxi`. If it is not
   listed, click **Adjust GitHub App Permissions**, add the `pontaxi` repo, and
   come back.
3. Leave every build setting alone. Framework auto-detects as **Vite**; Root
   Directory is `./`. `vercel.json` supplies the routing, and nothing else needs
   overriding.
4. **Deploy.** First build is about a minute.
5. **Settings → Domains** → add `pontaxi.fun` and `www.pontaxi.fun`.
6. At the registrar, create the records **exactly as the Domains tab prints
   them** — usually an `A` record on the apex and a `CNAME` on `www`. Do not
   copy IPs from memory or from this file; Vercel changes them.
7. Wait for the certificate to go green.

Pushes to `main` redeploy automatically from then on.

If the build ever fails on the Node version, set **Settings → Node.js Version**
to `22.x`; `package.json` only asks for `>=22`.

To deploy once from this machine without touching the dashboard:

```bash
vercel login
vercel link
vercel --prod
```

That does **not** set up deploy-on-push — only the Git import does.

To check the routing without deploying anything:

```bash
vercel build
cat .vercel/output/config.json
```

`handle: filesystem` must appear **before** the `/(.*) → /index.html` route.
That ordering is what makes hashed assets come off disk instead of being
swallowed by the single-page fallback.

### Railway

1. **railway.app → New Project → Deploy from GitHub repo**.
2. Grant the Railway GitHub App access to `shelbybrothers/pontaxi` — again,
   private repos are invisible to it until you do.
3. Pick the repo. Railway reads `railway.json` and `nixpacks.toml` on its own:
   Node 22, `npm ci`, `npm run build`, then `node server/index.mjs`.
4. **Settings → Root Directory: leave it empty.** The app is at the repo root.
   Pointing this at a subdirectory makes Railway build the wrong thing.
5. No environment variables are needed. Railway injects `PORT` and the server
   reads it; it binds `0.0.0.0` already.
6. **Settings → Networking → Generate Domain** for a
   `*.up.railway.app` URL, or **Custom Domain** to add your own and follow the
   CNAME it prints.
7. The health check is `/healthz` — it returns `ok` as soon as `dist/` exists.

To rehearse exactly what Railway runs, before pushing:

```bash
npm run build
PORT=8824 npm start      # http://localhost:8824
```

## Notes for later

- `document.hidden` stops `requestAnimationFrame`, so anything gated on a frame
  callback never resolves in a background tab. The loading gate uses a timer.
- Key handling matches `e.code` **or** `e.key`; `code` is empty on synthetic
  events and unhelpful on some layouts.
- Landmark sizes are clamped to the block in `placeLandmark` — content data
  cannot push a building onto the road.
