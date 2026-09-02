// @atlas: The 'CoordinateUtility' module. Provides essential math functions to convert between real-world cartesian meters and axial 'Hex' coordinates. It also handles dynamic EPSG:31254 projection calibration, using reference GPS data (e.g., from Kappl and St. Anton ski resorts) to maintain accurate metric scaling across the landscape.
import './gosper_core.js';

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

// Projection Calibration
let projParams = null;
let projectionPromise = null;

// Least-squares fit of target = a*lon + b*lat + c over reference points.
function fitPlane(points, targetKey) {
    let Sxx = 0, Sxy = 0, Sx = 0, Syy = 0, Sy = 0, S1 = 0, Sxt = 0, Syt = 0, St = 0;
    for (const p of points) {
        const { lon, lat } = p;
        const t = p[targetKey];
        Sxx += lon * lon; Sxy += lon * lat; Sx += lon;
        Syy += lat * lat; Sy += lat; S1 += 1;
        Sxt += lon * t; Syt += lat * t; St += t;
    }
    const A = [[Sxx, Sxy, Sx], [Sxy, Syy, Sy], [Sx, Sy, S1]];
    const B = [Sxt, Syt, St];
    for (let i = 0; i < 3; i++) {
        const piv = A[i][i];
        for (let j = i; j < 3; j++) A[i][j] /= piv;
        B[i] /= piv;
        for (let k = 0; k < 3; k++) {
            if (k === i) continue;
            const f = A[k][i];
            for (let j = i; j < 3; j++) A[k][j] -= f * A[i][j];
            B[k] -= f * B[i];
        }
    }
    return B; // [a, b, c]
}

export async function initProjection() {
    if (projParams) return true;
    if (projectionPromise) return projectionPromise;

    projectionPromise = (async () => {
        try {
            const res = await fetch('assets/skigebiete.json');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const areas = data.ski_areas;
            if (!areas?.length) throw new Error('projection reference points are missing');

            // A 2-point linear calibration (the previous approach) only holds
            // up near those two points — it drifts by 10-19km at the far
            // side of the Stubai valley. Fitting a plane across every known
            // ski-area reference point keeps it a rough approximation (not a
            // real EPSG:31254 transform) but brings error down to ~500m,
            // which is enough for tile-availability lookups to work.
            const points = areas.map(a => ({
                lon: a.gps.lon, lat: a.gps.lat,
                x: a.epsg_31254.x, y: a.epsg_31254.y,
            }));
            const [ax, bx, cx] = fitPlane(points, 'x');
            const [ay, by, cy] = fitPlane(points, 'y');

            projParams = { ax, bx, cx, ay, by, cy };
            console.log("Coordinate System Calibrated:", projParams);
            return true;
        } catch (e) {
            projectionPromise = null; // a later retry may succeed
            console.error("Failed to init projection", e);
            return false;
        }
    })();
    return projectionPromise;
}

export function latLonToWorld(lat, lon) {
    if (!projParams) return { x: 0, y: 0 };
    const { ax, bx, cx, ay, by, cy } = projParams;
    return { x: ax * lon + bx * lat + cx, y: ay * lon + by * lat + cy };
}

// Inverse of the same local calibration used by latLonToWorld(). This is a
// human-readable navigation coordinate, not a survey-grade CRS transform.
export function worldToLatLon(x, y) {
    if (!projParams) return null;
    const { ax, bx, cx, ay, by, cy } = projParams;
    // Solve the 2x2 linear system [[ax,bx],[ay,by]] * [lon,lat]^T = [x-cx, y-cy]^T
    const det = ax * by - bx * ay;
    const rx = x - cx, ry = y - cy;
    return {
        lon: (rx * by - bx * ry) / det,
        lat: (ax * ry - rx * ay) / det,
    };
}
