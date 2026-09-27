// Keep this normalization identical to service_worker.js's SCOPE_TAG.
export function scopeTagFromPath(scopePath) {
    return scopePath.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'root';
}

export function prefixCacheNames(scopePath) {
    const prefix = `hx2-${scopeTagFromPath(scopePath)}-`;
    return {
        ktx2: `${prefix}ktx2-prefix-v1`,
        gsp: `${prefix}gsp-prefix-v1`,
    };
}
