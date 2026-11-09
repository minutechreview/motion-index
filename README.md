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

Run `npm run check` to verify catalog entries, preview identifiers, attribution, structured data, and submission validation. Deploy the project to Vercel from this directory using the linked `motion-index-library` project.

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
