// Flat adapter that exposes globally anchored imagery pages to the generic
// frustum planner.  Pages are independent roots: no render-geometry hierarchy
// or ownership rule is visible through this interface.

export class TexturePageVisibilityAdapter {
    constructor({ pages, worldOrigin }) {
        if (!Array.isArray(pages)) throw new TypeError('pages must be an array');
        if (!worldOrigin || !Number.isFinite(worldOrigin.x) || !Number.isFinite(worldOrigin.y)) {
            throw new TypeError('worldOrigin must contain finite x/y');
        }
        this.pages = pages;
        this.worldOrigin = { x: worldOrigin.x, y: worldOrigin.y };
        this.roots = Uint32Array.from(pages.map((_, index) => index));
        this.verticalFactor = 1;
        this.verticalFloor = 0;
        this.verticalOffset = 0;
    }

    getRoots() { return this.roots; }
    getDepth() { return 0; }
    getChildCount() { return 0; }
    getChild() { throw new RangeError('texture pages have no children'); }
    getPage(handle) {
        const page = this.pages[Number(handle)];
        if (!page) throw new RangeError(`invalid texture page handle ${handle}`);
        return page;
    }
    getPageKey(handle) { return this.getPage(handle).key; }

    setVerticalTransform({ factor = 1, floor = 0, offset = 0 } = {}) {
        for (const [name, value] of Object.entries({ factor, floor, offset })) {
            if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
        }
        this.verticalFactor = factor;
        this.verticalFloor = floor;
        this.verticalOffset = offset;
    }

    sourceHeightToScene(height) {
        return (height - this.verticalFloor) * this.verticalFactor + this.verticalOffset;
    }

    writeBounds(handle, out = new Float64Array(6)) {
        const page = this.getPage(handle);
        const y0 = this.sourceHeightToScene(page.renderMin);
        const y1 = this.sourceHeightToScene(page.renderMax);
        out[0] = page.minX - this.worldOrigin.x;
        out[1] = Math.min(y0, y1);
        out[2] = -(page.maxY - this.worldOrigin.y);
        out[3] = page.maxX - this.worldOrigin.x;
        out[4] = Math.max(y0, y1);
        out[5] = -(page.minY - this.worldOrigin.y);
        return out;
    }

    writeProjectionSphere(handle, out = new Float64Array(4)) {
        const page = this.getPage(handle);
        const horizontalRadius = 0.5 * Math.hypot(
            page.maxX - page.minX,
            page.maxY - page.minY,
        );
        const verticalRadius = 0.5 * Math.abs(this.verticalFactor) * (page.hMax - page.hMin);
        out[0] = (page.minX + page.maxX) * 0.5 - this.worldOrigin.x;
        out[1] = this.sourceHeightToScene((page.hMin + page.hMax) * 0.5);
        out[2] = -((page.minY + page.maxY) * 0.5 - this.worldOrigin.y);
        // Quality demand encloses the terrain surface, not merely its average
        // elevation. This prevents a steep page whose visible slope is much
        // nearer than its midpoint from being under-ranked. Deliberately omit
        // renderMin/renderMax: skirt depth affects visibility, not imagery
        // resolution on the cap surface.
        out[3] = Math.hypot(horizontalRadius, verticalRadius);
        return out;
    }
}
