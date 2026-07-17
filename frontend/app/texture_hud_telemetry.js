// Read-only texture HUD telemetry.  This module deliberately knows nothing
// about texture demand, priority, or eviction: it only reports what the
// renderer can consume now and what already exists in residency state.

export const TEXTURE_HUD_ROWS = Object.freeze([
    Object.freeze({ tier: 'low128', label: 'LOW', size: 128, color: '#00ff30' }),
    Object.freeze({ tier: 'medium256', label: 'MED', size: 256, color: '#0060ff' }),
    Object.freeze({ tier: 'high4096', label: 'HIGH', size: 4096, color: '#ff00aa' }),
]);

const HUD_TIERS = new Set(TEXTURE_HUD_ROWS.map(row => row.tier));

function tierSets() {
    return Object.fromEntries(TEXTURE_HUD_ROWS.map(row => [row.tier, new Set()]));
}

function tierCounts() {
    return Object.fromEntries(TEXTURE_HUD_ROWS.map(row => [row.tier, 0]));
}

function mapEntries(mapLike) {
    if (mapLike?.entries) return mapLike.entries();
    if (Array.isArray(mapLike)) return mapLike.entries();
    return Object.entries(mapLike || {});
}

function visibleClassification(visibilityByKey, key) {
    if (!visibilityByKey?.get) return null;
    return visibilityByKey.get(key)?.classification || null;
}

function visitRenderedMaterials(root, visit) {
    if (!root || root.visible === false) return;

    // InstancedMesh.count is the submitted instance count.  A zero-count draw
    // is not a displayed consumer even when every ancestor remains visible.
    const hasDraws = !Number.isFinite(root.count) || root.count > 0;
    if (root.material && hasDraws) {
        const materials = Array.isArray(root.material) ? root.material : [root.material];
        for (const material of materials) {
            if (material?.visible !== false) visit(material);
        }
    }

    for (const child of root.children || []) visitRenderedMaterials(child, visit);
}

/**
 * Return unique page identities actually bound by currently visible rendered
 * geometry.  Manifest consumers and fetched-only assets are intentionally not
 * consulted: both include pages which are not on screen.
 */
export function collectDisplayedTexturePages(tiles, visibilityByKey) {
    const displayed = tierSets();

    for (const [key, tile] of mapEntries(tiles)) {
        if (!tile || tile.container?.visible === false || tile.mesh?.visible === false) continue;
        if (visibleClassification(visibilityByKey, key) !== 'visible') continue;

        visitRenderedMaterials(tile.mesh, material => {
            const bindings = material.userData?.texturePageBindings;
            if (!Array.isArray(bindings)) return;
            for (const binding of bindings) {
                const tier = binding?.tier;
                const pageKey = binding?.page?.key;
                if (!binding?.valid || !binding?.texture || !pageKey || !HUD_TIERS.has(tier)) continue;
                displayed[tier].add(String(pageKey));
            }
        });
    }

    return displayed;
}

export function countUnpaintedVisibleTiles(tiles, visibilityByKey) {
    let count = 0;

    for (const [key, tile] of mapEntries(tiles)) {
        if (!tile || tile.container?.visible === false || tile.mesh?.visible === false) continue;
        if (visibleClassification(visibilityByKey, key) !== 'visible') continue;

        let unpainted = false;
        visitRenderedMaterials(tile.mesh, material => {
            if (unpainted) return;
            const bindings = material.userData?.texturePageBindings;
            if (!Array.isArray(bindings)) return;
            let validEntries = 0;
            for (const binding of bindings) {
                if (binding?.valid && binding?.texture) {
                    validEntries++;
                } else {
                    unpainted = true;
                    return;
                }
            }
            if (validEntries === 0) unpainted = true;
        });
        if (unpainted) count++;
    }

    return count;
}

/** Count unique residency states per tier.  queued+loading is one pending page. */
export function collectTextureTierResidency(states) {
    const loaded = tierCounts();
    const pending = tierCounts();
    const failed = tierCounts();

    const values = states?.values ? states.values() : (states || []);
    for (const state of values) {
        for (const { tier } of TEXTURE_HUD_ROWS) {
            if (state?.assets?.has(tier)) loaded[tier]++;
            if (state?.queued?.has(tier) || state?.loading?.has(tier)) pending[tier]++;
            if (state?.failed?.has(tier)) failed[tier]++;
        }
    }
    return { loaded, pending, failed };
}
