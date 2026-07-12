// Geometry-independent addressing for a globally anchored square imagery grid.
// All coordinates are source-CRS metres.  The renderer may bind these pages to
// any geometry; neither ownership nor filenames are derived from render tiles.

function finiteNumber(value, label) {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new TypeError(`${label} must be finite`);
    return number;
}

function integer(value, label) {
    const number = Number(value);
    if (!Number.isInteger(number)) throw new TypeError(`${label} must be an integer`);
    return number;
}

export function texturePageKey(pageX, pageY) {
    return `${integer(pageX, 'pageX')}_${integer(pageY, 'pageY')}`;
}

export function texturePageIndex(value, origin, pageSize) {
    const coordinate = finiteNumber(value, 'coordinate');
    const anchor = finiteNumber(origin, 'origin');
    const size = finiteNumber(pageSize, 'pageSize');
    if (!(size > 0)) throw new RangeError('pageSize must be positive');
    return Math.floor((coordinate - anchor) / size);
}

export function texturePageUv(page, sourceX, sourceY) {
    if (!page) throw new TypeError('page is required');
    const width = finiteNumber(page.maxX, 'page.maxX') - finiteNumber(page.minX, 'page.minX');
    const height = finiteNumber(page.maxY, 'page.maxY') - finiteNumber(page.minY, 'page.minY');
    if (!(width > 0 && height > 0)) throw new RangeError('page bounds must have positive area');
    return Object.freeze([
        (finiteNumber(sourceX, 'sourceX') - page.minX) / width,
        (finiteNumber(sourceY, 'sourceY') - page.minY) / height,
    ]);
}

function upperBoundPageIndex(value, origin, pageSize, lowerIndex) {
    // Bounds are half-open.  ceil(...)-1 makes an edge exactly on a page
    // boundary belong only to the page on its lower side, while a zero-width
    // point still resolves to one deterministic page.
    const relative = (value - origin) / pageSize;
    return Math.max(lowerIndex, Math.ceil(relative) - 1);
}

function normalizedBounds(bounds) {
    if (!bounds || typeof bounds !== 'object') {
        throw new TypeError('bounds must be an object');
    }
    const minX = finiteNumber(bounds.minX ?? bounds.min_x, 'bounds.minX');
    const minY = finiteNumber(bounds.minY ?? bounds.min_y, 'bounds.minY');
    const maxX = finiteNumber(bounds.maxX ?? bounds.max_x, 'bounds.maxX');
    const maxY = finiteNumber(bounds.maxY ?? bounds.max_y, 'bounds.maxY');
    if (maxX < minX || maxY < minY) throw new RangeError('bounds must be ordered');
    return { minX, minY, maxX, maxY };
}

function fillTemplate(template, pageX, pageY, tier) {
    return template
        .replace('{page_x}', String(pageX))
        .replace('{page_y}', String(pageY))
        .replace('{tier}', String(tier));
}

export class TexturePageGrid {
    constructor(contract, { expectedCrs = null } = {}) {
        if (!contract || typeof contract !== 'object') {
            throw new TypeError('texture page contract is required');
        }
        const grid = contract.grid;
        if (!grid || typeof grid !== 'object') throw new TypeError('texture page grid is required');
        if (grid.index_rule !== 'floor') throw new Error("texture page index_rule must be 'floor'");

        this.crs = String(grid.crs || '');
        if (expectedCrs !== null && this.crs !== expectedCrs) {
            throw new Error(`texture page CRS must be ${expectedCrs}, got ${this.crs || '<missing>'}`);
        }
        this.originX = finiteNumber(grid.origin_x, 'grid.origin_x');
        this.originY = finiteNumber(grid.origin_y, 'grid.origin_y');
        this.pageSize = finiteNumber(grid.page_size_m, 'grid.page_size_m');
        if (!(this.pageSize > 0)) throw new RangeError('grid.page_size_m must be positive');
        this.urlTemplate = String(contract.url_template || '');
        this.cacheKey = contract.cache_key ?? contract.recipe_version ?? '';
        this.contract = contract;
        this.pages = [];
        this.pageByKey = new Map();

        for (const raw of contract.pages || []) {
            const pageX = integer(raw.page_x, 'page.page_x');
            const pageY = integer(raw.page_y, 'page.page_y');
            const key = texturePageKey(pageX, pageY);
            if (raw.key !== undefined && String(raw.key) !== key) {
                throw new Error(`page key ${raw.key} does not match ${key}`);
            }
            if (this.pageByKey.has(key)) throw new Error(`duplicate texture page ${key}`);
            const expected = this.cell(pageX, pageY);
            for (const [field, value] of [
                ['min_x', expected.minX], ['min_y', expected.minY],
                ['max_x', expected.maxX], ['max_y', expected.maxY],
            ]) {
                if (raw[field] !== undefined && Math.abs(Number(raw[field]) - value) > 1e-6) {
                    throw new Error(`page ${key} ${field} is not aligned to the global grid`);
                }
            }
            const hMin = finiteNumber(raw.hMin, `page ${key} hMin`);
            const hMax = finiteNumber(raw.hMax, `page ${key} hMax`);
            if (hMax < hMin) throw new RangeError(`page ${key} height bounds must be ordered`);
            const renderMin = finiteNumber(raw.renderMin, `page ${key} renderMin`);
            const renderMax = finiteNumber(raw.renderMax, `page ${key} renderMax`);
            if (renderMax < renderMin || renderMin > hMin || renderMax < hMax) {
                throw new RangeError(`page ${key} rendered height bounds must conservatively contain terrain`);
            }
            const page = Object.freeze({
                key,
                pageX,
                pageY,
                minX: expected.minX,
                minY: expected.minY,
                maxX: expected.maxX,
                maxY: expected.maxY,
                hMin,
                hMax,
                renderMin,
                renderMax,
                coverageTileCount: Number(raw.coverage_tile_count || 0),
                urls: Object.freeze({ ...(raw.urls || {}) }),
                available: true,
            });
            this.pages.push(page);
            this.pageByKey.set(key, page);
        }
        this.pages.sort((a, b) => (a.pageY - b.pageY) || (a.pageX - b.pageX));
        Object.freeze(this.pages);
    }

    indicesForPoint(x, y) {
        return Object.freeze({
            pageX: texturePageIndex(x, this.originX, this.pageSize),
            pageY: texturePageIndex(y, this.originY, this.pageSize),
        });
    }

    cell(pageX, pageY) {
        pageX = integer(pageX, 'pageX');
        pageY = integer(pageY, 'pageY');
        const minX = this.originX + pageX * this.pageSize;
        const minY = this.originY + pageY * this.pageSize;
        const key = texturePageKey(pageX, pageY);
        const available = this.pageByKey?.get(key);
        if (available) return available;
        return Object.freeze({
            key,
            pageX,
            pageY,
            minX,
            minY,
            maxX: minX + this.pageSize,
            maxY: minY + this.pageSize,
            hMin: 0,
            hMax: 0,
            renderMin: 0,
            renderMax: 0,
            coverageTileCount: 0,
            urls: Object.freeze({}),
            available: false,
        });
    }

    pageForPoint(x, y, { includeMissing = true } = {}) {
        const { pageX, pageY } = this.indicesForPoint(x, y);
        const cell = this.cell(pageX, pageY);
        return cell.available || includeMissing ? cell : null;
    }

    pagesForBounds(bounds, { includeMissing = true, maxPages = Infinity } = {}) {
        const normalized = normalizedBounds(bounds);
        const minPageX = texturePageIndex(normalized.minX, this.originX, this.pageSize);
        const minPageY = texturePageIndex(normalized.minY, this.originY, this.pageSize);
        const maxPageX = upperBoundPageIndex(
            normalized.maxX, this.originX, this.pageSize, minPageX);
        const maxPageY = upperBoundPageIndex(
            normalized.maxY, this.originY, this.pageSize, minPageY);
        const count = (maxPageX - minPageX + 1) * (maxPageY - minPageY + 1);
        if (count > maxPages) {
            throw new RangeError(`bounds intersect ${count} texture pages; maximum is ${maxPages}`);
        }
        const result = [];
        for (let pageY = minPageY; pageY <= maxPageY; pageY++) {
            for (let pageX = minPageX; pageX <= maxPageX; pageX++) {
                const cell = this.cell(pageX, pageY);
                if (cell.available || includeMissing) result.push(cell);
            }
        }
        return result;
    }

    urlFor(pageOrKey, tier) {
        const page = typeof pageOrKey === 'string'
            ? this.pageByKey.get(pageOrKey)
            : pageOrKey;
        if (!page?.available) return null;
        const explicit = page.urls?.[tier];
        if (explicit) return explicit;
        if (!this.urlTemplate) return null;
        return fillTemplate(this.urlTemplate, page.pageX, page.pageY, tier);
    }
}
