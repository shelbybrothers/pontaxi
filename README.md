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

### Vercel (the site)

`vercel.json` is committed, so importing the repo is enough — framework `vite`,
build `npm run build`, output `dist`. The rewrite sends every path that is not
`/assets/*` to `index.html`; `/assets/*` is content-hashed by Vite and is the
only thing marked `immutable`.

Point the `pontaxi.fun` domain at the project in **Settings → Domains**.

### Railway (alternative host)

`railway.json` and `nixpacks.toml` are committed. Create a service from the
repo and it builds with Node 22, runs `npm run build`, then serves `dist/` with
`server/index.mjs` on `$PORT`. Health check is `/healthz`.

Leave **Root Directory** empty — the app is at the repo root.

## Notes for later

- `document.hidden` stops `requestAnimationFrame`, so anything gated on a frame
  callback never resolves in a background tab. The loading gate uses a timer.
- Key handling matches `e.code` **or** `e.key`; `code` is empty on synthetic
  events and unhelpful on some layouts.
- Landmark sizes are clamped to the block in `placeLandmark` — content data
  cannot push a building onto the road.
