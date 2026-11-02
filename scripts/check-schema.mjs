import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('public/index.html', 'utf8');
const { entries, sources } = JSON.parse(readFileSync('public/catalog.json', 'utf8'));
const matches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
assert.equal(matches.length, 1, 'Expected one embedded JSON-LD graph');
const document = JSON.parse(matches[0][1]);
assert.equal(document['@context'], 'https://schema.org');
const base = 'https://motion-index-library.vercel.app/';
assert.ok(html.includes(`<link rel="canonical" href="${base}">`));
const graph = document['@graph'];
const byId = new Map(graph.map(node => [node['@id'], node]));
assert.equal(byId.size, graph.length, 'Graph identifiers must be unique');
const get = suffix => {
  const node = byId.get(`${base}#${suffix}`);
  assert.ok(node, `Missing graph node: ${suffix}`);
  return node;
};
const website = get('website');
const page = get('page');
const list = get('animation-list');
assert.equal(website['@type'], 'WebSite');
assert.equal(website.url, base);
assert.equal(page['@type'], 'CollectionPage');
assert.equal(page.url, base);
assert.equal(page.isPartOf['@id'], website['@id']);
assert.equal(page.mainEntity['@id'], list['@id']);
assert.equal(list['@type'], 'ItemList');
assert.equal(list.numberOfItems, entries.length);
assert.equal(list.itemListElement.length, entries.length);
assert.equal(page.citation.length, sources.length);

for (const [index, entry] of entries.entries()) {
  const expectedId = `${base}#style-${entry.id}`;
  const listItem = list.itemListElement[index];
  const preview = get(`style-${entry.id}`);
  const source = sources.find(item => item.id === entry.source.id);
  const sourceWork = get(`reference-${source.id}`);
  assert.equal(listItem['@type'], 'ListItem');
  assert.equal(listItem.position, index + 1);
  assert.equal(listItem.item['@id'], expectedId);
  assert.equal(preview['@type'], 'CreativeWork');
  assert.equal(preview.url, expectedId);
  assert.equal(preview.name, entry.title);
  assert.equal(preview.description, entry.description);
  assert.equal(preview.isPartOf['@id'], page['@id']);
  assert.equal(preview.creator, undefined, 'Reference creators must not be presented as preview creators');
  assert.equal(sourceWork.name, source.project);
  assert.equal(sourceWork.url, source.url);
  assert.ok(sourceWork.creator.length > 0, `Missing source credit for ${entry.id}`);
  for (const author of sourceWork.creator) {
    const credited = byId.get(author['@id']);
    assert.ok(credited && ['Person', 'Organization'].includes(credited['@type']) && credited.name);
  }
  if (entry.source.url === source.url) assert.equal(preview.citation['@id'], sourceWork['@id']);
  else {
    assert.equal(preview.citation.url, entry.source.url);
    assert.equal(preview.citation.isPartOf['@id'], sourceWork['@id']);
    assert.deepEqual(preview.citation.creator, sourceWork.creator);
  }
}
assert.deepEqual(get('reference-acid').creator.map(ref => byId.get(ref['@id']).name), ['Étienne Mineur', 'Floot']);
assert.equal(get('creator-aimotions').name, 'Alejandro López Martínez');
assert.equal(get('halden').license, `${base}fonts/OFL.txt`);
assert.equal(get('halden').copyrightHolder['@id'], get('fontzz-project-authors')['@id']);
assert.ok(!graph.some(node => ['VideoObject', 'Review', 'Product'].includes(node['@type'])), 'Do not claim unsupported media or ratings');
console.log(`Validated the embedded JSON-LD graph: ${entries.length} linked styles, ${sources.length} credited sources, and the font license.`);
