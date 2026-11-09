---
name: motion-index
description: Pick a motion-graphics style from Motion Index (60 credited styles - product turntables, kinetic type, data charts, editorial layouts, interface demos and more) and turn it into a build-ready brief for the user's topic. Use when the user wants an animated video, reel, title sequence, explainer, ad or motion graphic and needs a visual style or motion ideas, or mentions Motion Index.
---

# Motion Index

`catalog.json` (next to this file) holds the library. Each entry in `entries` has `id`, `title`, `category`
(Product, Type, Data, Editorial, Illustration, Interface, Abstract), `description`, `look`, `motion`, `use`
(what it suits), `source` (the original creator: `author`, `project`, `url`) and `prompt` (a copy-ready brief
with the placeholder `[YOUR TOPIC OR BRAND]`).

## Steps
1. **Find styles.** Read `catalog.json` and match the user's idea against `title`, `category`, `use` and
   `description`. Offer 3–5 options as a short list: title, one line on the look, and what it's best for.
   Each style has a preview at `https://motion.minutechbuilds.com/#style-<id>`.
2. **Write the brief** for the chosen style:
   - Start from its `prompt` and replace `[YOUR TOPIC OR BRAND]` with the user's topic.
   - Set the format: 9:16 at 1080x1920 for Reels/Shorts/TikTok unless they ask for 16:9 (1920x1080),
     1:1 (1080x1080) or 4:5 (1080x1350). Default length 8 s at 30 fps.
   - Add any colours, copy or brand rules the user gave.
3. **Keep the credit.** Always show `source.author`, `source.project` and `source.url` with the brief, and
   tell the user to credit the reference when they share the result. Make original assets; never copy the
   reference's footage or artwork.
4. **Build it** if the user wants: use whatever motion stack is available (HyperFrames, Remotion, CSS/SVG/GSAP,
   After Effects scripts) and show a preview.

To suggest a new style for the library, the user can use the form at https://motion.minutechbuilds.com.
For live data inside Claude or ChatGPT, the same library is also an MCP connector: https://motion.minutechbuilds.com/mcp
