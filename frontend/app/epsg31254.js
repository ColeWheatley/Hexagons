// @atlas: Exact WGS84 (GPS) <-> EPSG:31254 (MGI / Austria GK West) conversion.
//
// This replaces an earlier approach that "calibrated" a linear fit from a
// handful of ski-resort reference points. EPSG:31254 is a precisely defined
// projection, not a local grid to be curve-fitted, and the fitted version was
// 10-19km wrong outside the two resorts it was calibrated on.
//
// Pipeline mirrors what PROJ itself uses for EPSG:4326 -> EPSG:31254
// (`projinfo -s EPSG:4326 -t EPSG:31254`, "Inverse of MGI to WGS 84 (3) +
// Austria Gauss-Kruger West", stated accuracy 1.5 m):
//
//   WGS84 lat/lon -> ECEF(WGS84) -> inverse Helmert 7-param -> ECEF(Bessel)
//                 -> Bessel lat/lon -> Transverse Mercator (GK West)
//
// Heights are not modelled: this is a 2D transform and assumes h = 0, exactly
// as PROJ's `+proj=push/pop +v_3` steps do for 2D input.

const WGS84 = { a: 6378137.0, f: 1 / 298.257223563 };
const BESSEL = { a: 6377397.155, f: 1 / 299.152812800003 };

// EPSG:1618 "MGI to WGS 84 (3)", position-vector convention. Translations in
// metres, rotations in arc-seconds, scale in ppm -- as published, converted at
// point of use.
const HELMERT = {
    dx: 577.326, dy: 90.129, dz: 463.919,
    rx: 5.137, ry: 1.474, rz: 5.297,
    s: 2.4232,
};

// Austria GK West: lat_0=0, lon_0=10°20'E, k=1, x_0=0, y_0=-5000000.
const TM = { lon0: 10.3333333333333 * Math.PI / 180, k0: 1, x0: 0, y0: -5000000 };

const ARCSEC = Math.PI / (180 * 3600);
const DEG = Math.PI / 180;

function ecefFromGeodetic(latRad, lonRad, h, ell) {
    const e2 = ell.f * (2 - ell.f);
    const sinLat = Math.sin(latRad), cosLat = Math.cos(latRad);
    const N = ell.a / Math.sqrt(1 - e2 * sinLat * sinLat);
    return {
        x: (N + h) * cosLat * Math.cos(lonRad),
        y: (N + h) * cosLat * Math.sin(lonRad),
        z: (N * (1 - e2) + h) * sinLat,
    };
}

// Bowring's method: closed form, sub-millimetre for terrestrial points.
function geodeticFromEcef(x, y, z, ell) {
    const e2 = ell.f * (2 - ell.f);
    const b = ell.a * (1 - ell.f);
    const ep2 = e2 / (1 - e2);
    const p = Math.hypot(x, y);
    const theta = Math.atan2(z * ell.a, p * b);
    const sinT = Math.sin(theta), cosT = Math.cos(theta);
    const lat = Math.atan2(
        z + ep2 * b * sinT * sinT * sinT,
        p - e2 * ell.a * cosT * cosT * cosT,
    );
    return { lat, lon: Math.atan2(y, x) };
}

// Rotation+scale matrix M for the position-vector convention, so that
// V_wgs = T + M * V_mgi. Datum shift MGI->WGS84 applies M; WGS84->MGI applies
// its exact inverse (computed numerically rather than by the usual
// small-angle approximation, so both directions round-trip cleanly).
function helmertMatrix() {
    const { rx, ry, rz, s } = HELMERT;
    const [RX, RY, RZ] = [rx * ARCSEC, ry * ARCSEC, rz * ARCSEC];
    const scale = 1 + s * 1e-6;
    return [
        [scale, -scale * RZ, scale * RY],
        [scale * RZ, scale, -scale * RX],
        [-scale * RY, scale * RX, scale],
    ];
}

function invert3(m) {
    const [[a, b, c], [d, e, f], [g, h, i]] = m;
    const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
    return [
        [(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det],
        [(f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det],
        [(d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det],
    ];
}

const M_MGI_TO_WGS = helmertMatrix();
const M_WGS_TO_MGI = invert3(M_MGI_TO_WGS);

function applyMatrix(m, v) {
    return {
        x: m[0][0] * v.x + m[0][1] * v.y + m[0][2] * v.z,
        y: m[1][0] * v.x + m[1][1] * v.y + m[1][2] * v.z,
        z: m[2][0] * v.x + m[2][1] * v.y + m[2][2] * v.z,
    };
}

// Meridional arc length from the equator (lat_0 = 0, so M0 = 0).
function meridianArc(lat, a, e2) {
    const e4 = e2 * e2, e6 = e4 * e2;
    return a * (
        (1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * lat
        - (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * lat)
        + (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * lat)
        - (35 * e6 / 3072) * Math.sin(6 * lat)
    );
}

function footpointLatitude(M, a, e2) {
    const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
    const mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256));
    const e1_2 = e1 * e1, e1_3 = e1_2 * e1, e1_4 = e1_3 * e1;
    return mu
        + (3 * e1 / 2 - 27 * e1_3 / 32) * Math.sin(2 * mu)
        + (21 * e1_2 / 16 - 55 * e1_4 / 32) * Math.sin(4 * mu)
        + (151 * e1_3 / 96) * Math.sin(6 * mu)
        + (1097 * e1_4 / 512) * Math.sin(8 * mu);
}

/** WGS84 latitude/longitude in degrees -> EPSG:31254 easting/northing metres. */
export function wgs84ToEpsg31254(lat, lon) {
    const wgsEcef = ecefFromGeodetic(lat * DEG, lon * DEG, 0, WGS84);
    const shifted = applyMatrix(M_WGS_TO_MGI, {
        x: wgsEcef.x - HELMERT.dx,
        y: wgsEcef.y - HELMERT.dy,
        z: wgsEcef.z - HELMERT.dz,
    });
    const g = geodeticFromEcef(shifted.x, shifted.y, shifted.z, BESSEL);

    const e2 = BESSEL.f * (2 - BESSEL.f);
    const ep2 = e2 / (1 - e2);
    const sinLat = Math.sin(g.lat), cosLat = Math.cos(g.lat), tanLat = Math.tan(g.lat);
    const N = BESSEL.a / Math.sqrt(1 - e2 * sinLat * sinLat);
    const T = tanLat * tanLat;
    const C = ep2 * cosLat * cosLat;
    const A = (g.lon - TM.lon0) * cosLat;
    const A2 = A * A, A3 = A2 * A, A4 = A3 * A, A5 = A4 * A, A6 = A5 * A;
    const M = meridianArc(g.lat, BESSEL.a, e2);

    const easting = TM.k0 * N * (
        A + (1 - T + C) * A3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * A5 / 120
    ) + TM.x0;
    const northing = TM.k0 * (M + N * tanLat * (
        A2 / 2 + (5 - T + 9 * C + 4 * C * C) * A4 / 24
        + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * A6 / 720
    )) + TM.y0;

    return { x: easting, y: northing };
}

/** EPSG:31254 easting/northing metres -> WGS84 latitude/longitude in degrees. */
export function epsg31254ToWgs84(x, y) {
    const e2 = BESSEL.f * (2 - BESSEL.f);
    const ep2 = e2 / (1 - e2);
    const M = (y - TM.y0) / TM.k0;
    const phi1 = footpointLatitude(M, BESSEL.a, e2);

    const sinP = Math.sin(phi1), cosP = Math.cos(phi1), tanP = Math.tan(phi1);
    const C1 = ep2 * cosP * cosP;
    const T1 = tanP * tanP;
    const N1 = BESSEL.a / Math.sqrt(1 - e2 * sinP * sinP);
    const R1 = BESSEL.a * (1 - e2) / Math.pow(1 - e2 * sinP * sinP, 1.5);
    const D = (x - TM.x0) / (N1 * TM.k0);
    const D2 = D * D, D3 = D2 * D, D4 = D3 * D, D5 = D4 * D, D6 = D5 * D;

    const lat = phi1 - (N1 * tanP / R1) * (
        D2 / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D4 / 24
        + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D6 / 720
    );
    const lon = TM.lon0 + (
        D - (1 + 2 * T1 + C1) * D3 / 6
        + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D5 / 120
    ) / cosP;

    const besselEcef = ecefFromGeodetic(lat, lon, 0, BESSEL);
    const shifted = applyMatrix(M_MGI_TO_WGS, besselEcef);
    const g = geodeticFromEcef(
        shifted.x + HELMERT.dx,
        shifted.y + HELMERT.dy,
        shifted.z + HELMERT.dz,
        WGS84,
    );
    return { lat: g.lat / DEG, lon: g.lon / DEG };
}
