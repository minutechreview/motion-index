import { readFileSync, writeFileSync } from 'node:fs';

// The published canonical URL is stable across Vercel preview and production builds.
const base = 'https://motion-index-library.vercel.app/';
const { sources, entries } = JSON.parse(readFileSync('public/catalog.json', 'utf8'));
const byId = new Map(sources.map(source => [source.id, source]));
const knownTypes = { shaan: 'Person', ultra: 'Person', mndr: 'Person', aimotions: 'Person', animaguru: 'Organization', paper: 'Organization', ea: 'Organization', vibeknowledge: 'Person', open3d: 'Person', flat3d: 'Person', prothreads: 'Person', livingascii: 'Person', splashmotion: 'Person', futurepedia: 'Organization' };
const nodeId = suffix => `${base}#${suffix}`;
const ref = suffix => ({ '@id': nodeId(suffix) });
const creators = [];
const sourceCreators = new Map();

for (const source of sources) {
  let people;
  if (source.id === 'acid') {
    // Procedural Studio's own footer credits both contributors.
    people = [
      { key: 'etienne-mineur', type: 'Person', name: 'Étienne Mineur', url: source.authorUrl },
      { key: 'floot', type: 'Organization', name: 'Floot' },
    ];
  } else {
    const type = knownTypes[source.id];
    if (!type) throw new Error(`No structured creator mapping for source ${source.id}`);
    people = [{ key: source.id, type, name: source.author, url: source.authorUrl }];
  }
  sourceCreators.set(source.id, people.map(person => ref(`creator-${person.key}`)));
  creators.push(...people.map(person => ({
    '@type': person.type,
    '@id': nodeId(`creator-${person.key}`),
    name: person.name,
    ...(person.url ? { url: person.url } : {}),
  })));
}

const referenceWorks = sources.map(source => ({
  '@type': 'CreativeWork',
  '@id': nodeId(`reference-${source.id}`),
  name: source.project,
  url: source.url,
  creator: sourceCreators.get(source.id),
}));

const previews = entries.map(entry => {
  const source = byId.get(entry.source.id);
  if (!source) throw new Error(`Missing reference source for ${entry.id}`);
  const citation = entry.source.url === source.url
    ? ref(`reference-${source.id}`)
    : {
        '@type': 'CreativeWork',
        url: entry.source.url,
        isPartOf: ref(`reference-${source.id}`),
        creator: sourceCreators.get(source.id),
      };
  return {
    '@type': 'CreativeWork',
    '@id': nodeId(`style-${entry.id}`),
    url: nodeId(`style-${entry.id}`),
    name: entry.title,
    description: entry.description,
    inLanguage: 'en',
    isPartOf: ref('page'),
    citation,
  };
});

const graph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite', '@id': nodeId('website'),
      url: base, name: 'Motion Index', inLanguage: 'en',
      description: 'A visual reference library for motion graphics, with animated previews, prompts, and creator credits.',
    },
    {
      '@type': 'CollectionPage', '@id': nodeId('page'),
      url: base, name: 'Motion Index — a living library of motion', inLanguage: 'en',
      description: 'A visual reference library for motion graphics. Watch a style, copy its prompt, and make it your own.',
      isPartOf: ref('website'), mainEntity: ref('animation-list'),
      citation: sources.map(source => ref(`reference-${source.id}`)),
      mentions: [ref('fontzz'), ref('halden')],
    },
    {
      '@type': 'ItemList', '@id': nodeId('animation-list'),
      name: 'Motion Index animation styles', numberOfItems: entries.length,
      itemListElement: entries.map((entry, index) => ({
        '@type': 'ListItem', position: index + 1, item: ref(`style-${entry.id}`),
      })),
    },
    ...previews,
    ...referenceWorks,
    ...creators,
    { '@type': 'Person', '@id': nodeId('creator-hassan'), name: 'Hassan' },
    { '@type': 'Person', '@id': nodeId('creator-youssef'), name: 'Youssef' },
    { '@type': 'Organization', '@id': nodeId('fontzz-project-authors'), name: 'The fontzz Project Authors' },
    {
      '@type': 'CreativeWork', '@id': nodeId('fontzz'),
      name: 'Fontzz', url: 'https://fontzz.vercel.app/',
      creator: [ref('creator-hassan'), ref('creator-youssef')],
    },
    {
      '@type': 'CreativeWork', '@id': nodeId('halden'),
      name: 'Halden typeface', url: `${base}fonts/halden.woff2`,
      license: `${base}fonts/OFL.txt`,
      copyrightNotice: 'Copyright 2026 The fontzz Project Authors',
      copyrightHolder: ref('fontzz-project-authors'),
    },
  ],
};

const start = '  <!-- SCHEMA:START -->';
const end = '  <!-- SCHEMA:END -->';
const path = 'public/index.html';
const html = readFileSync(path, 'utf8');
const begin = html.indexOf(start);
const finish = html.indexOf(end);
if (begin < 0 || finish < begin || html.indexOf(start, begin + 1) !== -1 || html.indexOf(end, finish + 1) !== -1) {
  throw new Error('Expected exactly one schema placeholder in the HTML head.');
}
// Escaping '<' keeps even future user-authored catalog values inside the script element.
const serialized = JSON.stringify(graph).replace(/</g, '\\u003c');
const replacement = `${start}\n  <script type="application/ld+json">${serialized}</script>\n`;
writeFileSync(path, html.slice(0, begin) + replacement + html.slice(finish));
console.log(`Built structured data for ${entries.length} animation styles and ${sources.length} credited reference collections.`);
