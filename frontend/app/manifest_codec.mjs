// @atlas: Expands a compact manifest (scripts/compact_manifest.py) back into the
// exact in-memory shape the viewer has always consumed: `tiles[]` with world
// x/y, and `texture_pages.pages[]` with key, bounds, per-tier urls. Full-format
// manifests pass through untouched, so every release stays loadable.

export const COMPACT_MANIFEST_FORMAT = 'hexagons-compact-manifest';
export const COMPACT_MANIFEST_VERSION = 1;

const SQRT3 = Math.sqrt(3);
const TILE_LEVEL = 5;

function latticeToWorld(yq, yr, unitHexM) {
    let q = yq, r = yr;
    for (let i = 0; i < TILE_LEVEL; i++) {
        const nq = 2 * q - r;
        const nr = q + 3 * r;
        q = nq; r = nr;
    }
    return [q * (SQRT3 / 2) * unitHexM, r * unitHexM + q * 0.5 * unitHexM];
}

function round2(value) {
    return Math.round(value * 100) / 100;
}

function undelta(data) {
    const out = new Array(data.length);
    let acc = 0;
    for (let i = 0; i < data.length; i++) {
        acc += data[i];
        out[i] = acc;
    }
    return out;
}

function decodeColumn(column, count) {
    switch (column.enc) {
        case 'const': {
            const json = JSON.stringify(column.value);
            const out = new Array(count);
            // Objects must not be shared between records: callers may mutate.
            const isObject = column.value !== null && typeof column.value === 'object';
            for (let i = 0; i < count; i++) out[i] = isObject ? JSON.parse(json) : column.value;
            return out;
        }
        case 'delta':
            return undelta(column.data);
        case 'dm-delta':
            return undelta(column.data).map(v => v / 10);
        case 'raw':
            return column.data.slice();
        default:
            throw new Error(`Unknown compact manifest column encoding: ${column.enc}`);
    }
}

function fillTemplate(template, values) {
    let out = template;
    for (const [key, value] of Object.entries(values)) out = out.split(`{${key}}`).join(String(value));
    return out;
}

function pageUrls(contract, pageX, pageY) {
    const urls = {};
    const template = contract.url_template || '';
    for (const tier of contract.tiers || []) {
        urls[tier.name] = fillTemplate(template, { tier: tier.name, page_x: pageX, page_y: pageY });
    }
    if (contract.bootstrap?.url_template) {
        urls.bootstrap = fillTemplate(contract.bootstrap.url_template, { page_x: pageX, page_y: pageY });
    }
    return urls;
}

export function isCompactManifest(manifest) {
    return manifest?.format === COMPACT_MANIFEST_FORMAT;
}

/** Return a full-format manifest; full-format input is returned as-is. */
export function expandManifest(manifest) {
    if (!isCompactManifest(manifest)) return manifest;
    if (manifest.format_version !== COMPACT_MANIFEST_VERSION) {
        throw new Error(`Unsupported compact manifest version ${manifest.format_version}`);
    }
    const {
        format: _format, format_version: _version,
        tiles_compact: tc, pages_compact: pc, texture_pages: contractIn, ...base
    } = manifest;
    const unitHexM = base.unit_hex_m ?? 6.4;

    const tileColumns = {};
    for (const [key, column] of Object.entries(tc.columns)) tileColumns[key] = decodeColumn(column, tc.count);
    const tileDerived = new Set(tc.derived || []);
    const tiles = new Array(tc.count);
    for (let i = 0; i < tc.count; i++) {
        const tile = {};
        let world = null;
        for (const key of tc.keys) {
            if ((key === 'x' || key === 'y') && tileDerived.has(key)) {
                world ??= latticeToWorld(tileColumns.yq[i], tileColumns.yr[i], unitHexM);
                tile[key] = round2(key === 'x' ? world[0] : world[1]);
            } else {
                tile[key] = tileColumns[key][i];
            }
        }
        tiles[i] = tile;
    }

    const contract = { ...contractIn };
    const size = contract.grid?.page_size_m;
    const pageColumns = {};
    for (const [key, column] of Object.entries(pc.columns)) pageColumns[key] = decodeColumn(column, pc.count);
    const pageDerived = new Set(pc.derived || []);
    const pages = new Array(pc.count);
    for (let i = 0; i < pc.count; i++) {
        const px = pageColumns.page_x[i];
        const py = pageColumns.page_y[i];
        const page = {};
        for (const key of pc.keys) {
            if (!pageDerived.has(key)) page[key] = pageColumns[key][i];
            else if (key === 'key') page.key = `${px}_${py}`;
            else if (key === 'urls') page.urls = pageUrls(contract, px, py);
            else if (key === 'renderMax') page.renderMax = pageColumns.hMax[i];
            else if (key === 'min_x') page.min_x = px * size;
            else if (key === 'min_y') page.min_y = py * size;
            else if (key === 'max_x') page.max_x = (px + 1) * size;
            else if (key === 'max_y') page.max_y = (py + 1) * size;
            else throw new Error(`Compact manifest cannot derive page field ${key}`);
        }
        pages[i] = page;
    }
    contract.pages = pages;
    return { ...base, texture_pages: contract, tiles };
}
