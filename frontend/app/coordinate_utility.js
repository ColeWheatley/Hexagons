// @atlas: The 'CoordinateUtility' module. Provides essential math functions to convert between real-world cartesian meters and axial 'Hex' coordinates. World metres are EPSG:31254 (MGI / Austria GK West), the CRS the DEM, orthophotos, and tile manifest are authored in; GPS conversion is an exact projection (see epsg31254.js), not a calibration against reference points.
import './gosper_core.js';
import { epsg31254ToWgs84, wgs84ToEpsg31254 } from './epsg31254.js';

const UNIT_HEX_PX = 32.0;
const METERS_PER_PIXEL = 0.2;
const UNIT_HEX_WIDTH_METERS = UNIT_HEX_PX * METERS_PER_PIXEL; // 6.4m
export const SECTOR_WIDTH_METERS = 819.2; // legacy 4096px sector width (pre-gosper)

export function axialToWorldMeters(q, r) {
    const h = UNIT_HEX_WIDTH_METERS;
    const world_x = (q * (Math.sqrt(3) / 2) * h);
    const world_y = (r * h + q * 0.5 * h);
    return { x: world_x, y: world_y };
}

export function worldMetersToAxial(x, y) {
    const h = UNIT_HEX_WIDTH_METERS;
    const A = (Math.sqrt(3) / 2 * h);
    const q = x / A;
    const r = (y - (q * 0.5 * h)) / h;
    return { q: Math.round(q), r: Math.round(r) };
}

export function worldToSectorID(worldX, worldY) {
    return {
        q: Math.floor(worldX / SECTOR_WIDTH_METERS),
        r: Math.floor(worldY / SECTOR_WIDTH_METERS)
    };
}

// Lattice coords of the Gosper L5 island tile owning a world position.
export function worldToGosperTile(worldX, worldY) {
    const G = window.GosperCore;
    const h = UNIT_HEX_WIDTH_METERS;
    const fq = worldX / ((Math.sqrt(3) / 2) * h);
    const fr = (worldY - (fq * 0.5 * h)) / h;
    // cube-round to the nearest unit cell
    const fx = fq, fz = fr, fy = -fq - fr;
    let rx = Math.round(fx), ry = Math.round(fy), rz = Math.round(fz);
    const dx = Math.abs(rx - fx), dy = Math.abs(ry - fy), dz = Math.abs(rz - fz);
    if (dx > dy && dx > dz) rx = -ry - rz;
    else if (dy > dz) ry = -rx - rz;
    else rz = -rx - ry;
    const [yq, yr] = G.tileOfUnit(rx, rz);
    return { yq, yr };
}

// Projection
//
// World coordinates ARE EPSG:31254 metres (the CRS the DEM, orthophotos, and
// tile manifest are all authored in), so this is a real projection, not a
// calibration. An earlier version fitted a linear approximation from two ski
// resorts' known coordinates; that was 10-19km wrong outside the Arlberg
// corner those two sat in, which made every peak elsewhere resolve outside
// the baked tile grid. Nothing needs fetching or calibrating now, but
// initProjection() keeps its async shape because callers await it.

export async function initProjection() {
    return true;
}

export function latLonToWorld(lat, lon) {
    return wgs84ToEpsg31254(lat, lon);
}

export function worldToLatLon(x, y) {
    return epsg31254ToWgs84(x, y);
}
