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
    if (an && bn && a.added !== b.added) return a.added < b.added ? 1 : -1;
    const af = a.featured ?? Infinity, bf = b.featured ?? Infinity;
    if (af !== bf) return af - bf;
    return a.index - b.index;
  };
}
