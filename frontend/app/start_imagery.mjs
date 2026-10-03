// Bounded first-view coverage from existing KTX2 mip prefixes. Coordinates
// are in the imagery CRS, after URL/default/saved-view restoration.
import { NET_PRIORITY } from './net_scheduler.mjs';

export function startImageryPages(pages, target, { maxPages = 24, radiusM = 6000 } = {}) {
    if (!Number.isFinite(target?.x) || !Number.isFinite(target?.y)) return [];
    return Array.from(pages, page => {
        const dx = Math.max(page.minX - target.x, 0, target.x - page.maxX);
        const dy = Math.max(page.minY - target.y, 0, target.y - page.maxY);
        return { page, distance: Math.hypot(dx, dy) };
    }).filter(item => item.distance <= radiusM)
        .sort((a, b) => a.distance - b.distance || a.page.key.localeCompare(b.page.key))
        .slice(0, maxPages).map(item => item.page);
}

export async function preloadStartImagery({
    pages, target, store, urlForPage, signal, isCurrent = () => true,
    maxPages = 24, onLoaded = () => {},
}) {
    const pending = startImageryPages(pages, target, { maxPages });
    let index = 0;
    // Two small coverage requests at a time, below visible first-paint work.
    // The same byte store serves normal loads, so overlapping demand shares
    // downloads and raises their priority rather than downloading twice.
    await Promise.all(Array.from({ length: 2 }, async () => {
        while (!signal?.aborted && isCurrent() && index < pending.length) {
            const page = pending[index++];
            try {
                const result = await store.ensureLevel(urlForPage(page), 5, {
                    priority: NET_PRIORITY.GUARD, signal,
                });
                if (!signal?.aborted && isCurrent()) onLoaded(page, result);
            } catch {
                // Visible demand owns retries. Background coverage is optional.
            }
        }
    }));
}
