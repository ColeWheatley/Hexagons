const MIB = 1024 * 1024;

export const GEOMETRY_BUDGET_BYTES = Object.freeze({
    high: 384 * MIB,
    mid: 160 * MIB,
    low: 48 * MIB,
});

export function hiddenGeometryEvictions({
    tiles,
    ledger,
    cameraPosition,
    capability,
    farDistanceMeters = 15000,
}) {
    const budget = GEOMETRY_BUDGET_BYTES[capability] ?? GEOMETRY_BUDGET_BYTES.mid;
    let excess = ledger.totalGeometryBytes - budget;
    if (excess <= 0) return [];

    const hidden = [];
    for (const [key, tile] of tiles) {
        if (!tile.hidden) continue;
        const bytes = ledger.entries.get(key)?.geometryBytes || 0;
        const distance = Math.hypot(tile.lx - cameraPosition.x, tile.lz - cameraPosition.z);
        hidden.push({ key, bytes, distance, lastVisiblePass: tile.lastVisiblePass || 0 });
    }
    hidden.sort((a, b) =>
        Number(b.distance > farDistanceMeters) - Number(a.distance > farDistanceMeters) ||
        a.lastVisiblePass - b.lastVisiblePass ||
        b.distance - a.distance ||
        a.key.localeCompare(b.key));

    const evictions = [];
    for (const tile of hidden) {
        if (excess <= 0) break;
        evictions.push(tile.key);
        excess -= tile.bytes;
    }
    return evictions;
}
