# Motion Index

A visual library of 60 motion-graphics interpretations, with source links, prompt copying, search, category filters, a downloadable agent skill, and a suggestion form.

Production: https://motion-index-library.vercel.app/

## Run locally

```sh
npm install
npm run build
python3 -m http.server 53172 --directory public
```

The static preview does not run the serverless submission endpoint. On Vercel the form is handled by `api/submit.js` and saves validated JSON files to the private `motion-index-submissions` Blob store. The project must have the `BLOB_READ_WRITE_TOKEN` environment variable injected by connecting that store. Submissions can be reviewed from the Vercel account's Storage dashboard. The initial `QA test — ignore` item was created to verify the form.

## Editing the library

Edit entries and their source links in `scripts/build-catalog.mjs`, then run `npm run build`. The script writes `public/catalog.json`, which both the site and the agent skill use. Add a corresponding preview in the `shapes` object in `public/app.js` and its styling in `public/styles.css`. The ten styles credited to Gian Angioletti live in their own module, `public/scenes-ultra.js` with `public/scenes-ultra.css`.

### New styles

The first time `npm run build` sees a style, it records the date in `scripts/added-dates.json`. Styles added after the launch collection (`LAUNCH_DATE` in `scripts/build-catalog.mjs`) count as **New** for `NEW_WINDOW_DAYS` (21) days: they get a New badge, lead the library in every view, and appear under the **New** filter, which hides itself when nothing is new. Anything that adds styles, including a scheduled job, should add the row to `scripts/build-catalog.mjs`, run `npm run build && npm run check`, and commit `scripts/added-dates.json` along with the catalog. If the dates file is not committed, each deploy stamps the style with that deploy's date. The build also copies the catalog into `skills/motion-index/catalog.json`; re-zip `public/downloads/motion-index-skill.zip` when you ship.

Run `npm run check` to verify catalog entries, preview identifiers, attribution, structured data, and submission validation. Deploy the project to Vercel from this directory using the linked `motion-index-library` project.

## Likes, copies and trending

Visitors can like a style (one like per browser and per network, and they can take it back), and every prompt copy is counted once per visitor per style per day. `/api/stats` serves the totals plus a 7-day trending score (likes count three times a copy, today counts most). The default **Recommended** order is New styles first, then this week's trending, then the featured demos and the rest; the Sort menu also offers Most liked, Most copied, Newest and A-Z.

Counts live in Upstash Redis, connected to the Vercel project from the Storage tab; `api/_store.js` reads the integration's `*_KV_REST_API_URL` / `*_KV_REST_API_TOKEN` variables whatever their prefix. Writes are atomic Lua scripts, writes must come from the site's own origin, and each IP is limited to 40 actions a minute. The public totals are cached at the edge for 60 seconds. Without the store configured, the site works as before and simply hides counts.

To try it locally with an in-memory store: `node scripts/dev-server.mjs` and open http://localhost:53180 (counts reset when it stops). `npm run check` includes `scripts/check-stats.mjs`.

**Community credit:** a catalog row may take an optional ninth field, `{ name: '@handle', url: 'https://...' }`, for an approved submission. Those tiles read "BY @handle" and a Community filter appears.

## Search structured data

`npm run build` regenerates the catalog and embeds a Schema.org JSON-LD graph in the HTML head. The graph describes the website, collection, animation previews, cited reference collections and credited creators. Each preview uses a `#style-...` anchor on the page; source creators are attached to the cited references rather than presented as creators of the local previews. The Fontzz and Halden credits are represented separately.

When adding a new reference collection, add its creator type to `scripts/build-schema.mjs`. The build fails if a source lacks a mapping, and `npm run check` checks that the graph matches the catalog. The canonical URL is defined in `public/index.html` and `scripts/build-schema.mjs`; update both if the public domain changes. Validate the deployed page with the Schema Markup Validator. General collection markup does not itself guarantee a Google rich result or indexing.

## Use it in Claude, ChatGPT and other AI apps

**Connector (MCP):** `https://motion.minutechbuilds.com/mcp` gives any MCP client four tools: `motion_search`,
`motion_style`, `motion_brief` and `motion_suggest`.
- Claude (web, desktop): Settings → Connectors → Add custom connector → paste the URL.
- Claude Code: `claude mcp add --transport http motion-index https://motion.minutechbuilds.com/mcp`
- ChatGPT: create a custom MCP app/connector in Settings (Apps or Plugins; some plans first need Developer mode),
  paste the URL and choose no authentication.

**Claude Skill:** download [`motion-index-skill.zip`](https://motion.minutechbuilds.com/downloads/motion-index-skill.zip)
and upload it in Claude → Settings → Capabilities → Skills. The source is in `skills/motion-index/`. After editing the
library, copy `public/catalog.json` into `skills/motion-index/` and re-zip (`npm run check` catches a stale copy).

## Credits

The previews are independently built interpretations; each card and copied prompt includes a linked credit to its reference. The reference collections are:

- [Shaan Johari](https://www.instagram.com/viashaan/) — [Animation styles you can build with Claude (or Codex)](https://ruby-cotija-fb5.notion.site/Animation-styles-you-can-build-with-Claude-or-Codex-3fa28691eca3814ebb34c73a7cc261bf).
- [Samer](https://mndr.ai/blog/author/samer/) — [MNDR's 36 Motion Graphic Styles](https://mndr.ai/blog/motion-graphics-with-claude/).
- [Alejandro López Martínez (develatter)](https://develatter.com/) — [aimotions](https://aimotions.art/).
- [AnimaGuru / Docyrus, Inc.](https://animaguru.com/about) — [AnimaGuru Motion Library](https://animaguru.com/motion-library).
- [Étienne Mineur and Floot](https://proceduralstudio.etienne.design/studio/flow-field-typography) — Procedural Studio.
- [EA DESIGN (@eadesignofficial)](https://www.instagram.com/eadesignofficial/) — [Brand-consistent social design pack reel](https://www.instagram.com/reel/DcGaekAMU90/).
- [Gian Angioletti (@ultra.skills)](https://www.instagram.com/ultra.skills/) — [30 Claude animations reel](https://www.instagram.com/reel/DfcxCxTBVsw/). Ten styles from the reel that the library did not already cover; the previews are original CSS interpretations and use none of the reel's frames.
- [Paper Animators](https://paperanimators.com/about/) — [Paper Animators Motion Library](https://paperanimators.com/videos/). The source does not publicly identify an individual creator.

[Fontzz](https://fontzz.vercel.app/), built by Hassan and Youssef, inspired the interface. The Halden typeface is copyright 2026 The fontzz Project Authors and is distributed under the SIL Open Font License 1.1; see `public/fonts/OFL.txt`.
