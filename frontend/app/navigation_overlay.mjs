export function niceDistance(value) {
    if (!Number.isFinite(value) || value <= 0) return 1;
    const power = 10 ** Math.floor(Math.log10(value));
    const normalized = value / power;
    return (normalized >= 5 ? 5 : normalized >= 2 ? 2 : 1) * power;
}
export function formatDistance(meters) { return meters >= 1000 ? `${Number((meters / 1000).toFixed(meters >= 10000 ? 0 : 1))} km` : `${Math.round(meters)} m`; }
export function navigationOverlayState({ camera, target, viewportWidth, viewportHeight }) {
    const dx = target.x - camera.x, dy = target.y - camera.y, dz = target.z - camera.z;
    const distance = Math.hypot(dx, dy, dz), width = Number(viewportWidth), height = Number(viewportHeight);
    const horizontalMeters = 2 * distance * Math.tan((camera.fov * Math.PI / 180) / 2) * (width / height);
    const meters = niceDistance(horizontalMeters * 0.18);
    const rotation = -Math.atan2(dx, -dz) * 180 / Math.PI;
    return { meters, label: formatDistance(meters), pixels: Math.max(36, Math.min(width * 0.28, (meters / horizontalMeters) * width)), compassRotation: Object.is(rotation, -0) ? 0 : rotation };
}
