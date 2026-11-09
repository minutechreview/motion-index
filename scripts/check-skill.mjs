// check-skill.mjs: the Claude Skill's bundled catalog must match the site's catalog.
import { readFileSync } from 'node:fs';
const site = readFileSync('public/catalog.json', 'utf8');
const skill = readFileSync('skills/motion-index/catalog.json', 'utf8');
if (site !== skill) { console.error('skills/motion-index/catalog.json is stale: copy public/catalog.json and re-zip (see README).'); process.exit(1); }
console.log('skill catalog matches the site');
