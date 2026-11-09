// Which styles count as new, and the order the library shows them in.
// A style is new when it was added after the launch collection and within the catalog's new window.
const DAY = 86400000;

export function newChecker(catalog, now = Date.now()) {
  const launch = Date.parse(catalog.launchDate ?? '');
  const windowDays = Number(catalog.newWindowDays ?? 0);
  return entry => {
    const added = Date.parse(entry.added ?? '');
    if (!Number.isFinite(added) || !Number.isFinite(launch) || added <= launch) return false;
    return (now - added) / DAY <= windowDays;
  };
}

// New styles first (newest first), then the featured demos in their set order, then the rest by index.
export function libraryOrder(isNew) {
  return (a, b) => {
    const an = isNew(a), bn = isNew(b);
    if (an !== bn) return an ? -1 : 1;
    if (an && bn) {
      // Newest date first; on the same day, the later catalog row (added last) leads.
      if (a.added !== b.added) return a.added < b.added ? 1 : -1;
      return b.index - a.index;
    }
    const af = a.featured ?? Infinity, bf = b.featured ?? Infinity;
    if (af !== bf) return af - bf;
    return a.index - b.index;
  };
}

// Library order for each sort mode. `stats` holds { likes, copies, trending } maps keyed by style id.
export const SORTS = ['recommended', 'liked', 'copied', 'newest', 'az'];
export function sorter(mode, isNew, stats = { likes: {}, copies: {}, trending: {} }) {
  const base = libraryOrder(isNew);
  const n = (map, e) => map?.[e.id] ?? 0;
  const by = (map) => (a, b) => n(map, b) - n(map, a) || base(a, b);
  switch (mode) {
    case 'liked': return by(stats.likes);
    case 'copied': return by(stats.copies);
    case 'newest': return (a, b) => (a.added === b.added ? b.index - a.index : a.added < b.added ? 1 : -1);
    case 'az': return (a, b) => a.title.localeCompare(b.title);
    default: return (a, b) => {
      // New first, then this week's trending, then the featured demos and the rest.
      const an = isNew(a), bn = isNew(b);
      if (an !== bn) return an ? -1 : 1;
      if (an && bn) return base(a, b);
      return n(stats.trending, b) - n(stats.trending, a) || base(a, b);
    };
  }
}
