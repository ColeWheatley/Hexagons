// Pure search-index helpers kept separate from the DOM component so ranking can
// be fixture-tested in Node as well as used in the browser.

export function normalizeSearchText(value) {
    return String(value ?? '')
        .toLocaleLowerCase('de')
        .replaceAll('ß', 'ss')
        .replaceAll('æ', 'ae')
        .replaceAll('œ', 'oe')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

function editDistance(a, b, stopAfter) {
    if (Math.abs(a.length - b.length) > stopAfter) return stopAfter + 1;
    let previousPrevious = null;
    let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i++) {
        const current = [i];
        let rowMin = i;
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            let value = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
            if (previousPrevious && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                value = Math.min(value, previousPrevious[j - 2] + 1);
            }
            current.push(value);
            rowMin = Math.min(rowMin, value);
        }
        if (rowMin > stopAfter) return stopAfter + 1;
        previousPrevious = previous;
        previous = current;
    }
    return previous[b.length];
}

function scoreTerm(query, term) {
    if (term === query) return 0;
    if (term.startsWith(query)) return 10 + Math.min(9, term.length - query.length);
    const words = term.split(' ');
    const exactWord = words.indexOf(query);
    if (exactWord >= 0) return 20 + exactWord;
    const prefixWord = words.findIndex(word => word.startsWith(query));
    if (prefixWord >= 0) return 24 + prefixWord;
    const substring = term.indexOf(query);
    if (substring >= 0) return 32 + Math.min(12, substring);
    if (query.length < 3) return Number.POSITIVE_INFINITY;

    const threshold = query.length <= 4 ? 1 : query.length <= 8 ? 2 : 3;
    let best = Number.POSITIVE_INFINITY;
    for (const candidate of [term, ...words]) {
        if (!candidate) continue;
        const comparable = candidate.length > query.length + threshold ? candidate.slice(0, query.length) : candidate;
        const distance = editDistance(query, comparable, threshold);
        if (distance <= threshold) {
            best = Math.min(best, 50 + distance * 8 + Math.abs(comparable.length - query.length));
        }
    }
    return best;
}

export function scoreSearchItem(item, normalizedQuery) {
    let best = Number.POSITIVE_INFINITY;
    for (const term of item.terms.split('|')) best = Math.min(best, scoreTerm(normalizedQuery, term));
    return best;
}

export function rankSearchItems(items, query, limit, isAvailable = item => item.available !== false) {
    const normalizedQuery = normalizeSearchText(query);
    if (normalizedQuery.length < 2) return [];
    let matches = items
        .map((item, sourceOrder) => ({
            item,
            sourceOrder,
            available: Boolean(isAvailable(item)),
            score: scoreSearchItem(item, normalizedQuery),
        }))
        .filter(match => Number.isFinite(match.score));
    // Typo recovery is a fallback. A merely fuzzy on-map result must not bury
    // an exact/prefix/substring match that happens to sit outside this bake.
    if (matches.some(match => match.score < 50)) matches = matches.filter(match => match.score < 50);
    return matches
        .sort((a, b) =>
            Number(b.available) - Number(a.available)
            || a.score - b.score
            || a.item.name.localeCompare(b.item.name, 'de')
            || a.sourceOrder - b.sourceOrder
        )
        .slice(0, limit)
        .map(match => match.item);
}
