// PowFinder colormap LUT + legend data model (design doc §2.5, §2.7, §3.5).
//
// A single 256 x RAMP_COUNT RGBA texture carries every ramp — continuous or
// categorical — as 256 baked entries, so the shader has exactly one sampling
// code path (`sidecarRamp()` in main.js) and no per-layer branching. This
// module is the *only* place ramp colours are defined; `rampStops()` feeds
// the DOM legend from the same data, so the legend can never drift from the
// shader (§2.5, last paragraph).
//
// Byte value 0 is the reserved NODATA sentinel in every sidecar layer (§1.1):
// the real domain is 1..255. The fragment shader already guards this
// (`if (raw < 0.5) return vec4(0.0);` in `sidecarRamp()`, main.js §2.3)
// before it ever samples the LUT, so the LUT's own column-0 texel is never
// read in production. `buildLutData()` still writes it as fully transparent
// (0,0,0,0) for every row, belt-and-suspenders, so anything that samples the
// LUT directly (this module's own helpers, a future debug view) sees the
// same "no data" convention the shader enforces.
export const NODATA_BYTE = 0;

// Row order mirrors the §2.5 table exactly. Rows 5-7 are reserved: a future
// layer ships as one more row here plus an `index.json` entry, no shader
// change (§2.5, row 5-7 note).
export const RAMP_IDS = Object.freeze(['powder', 'hazard', 'depth', 'surface', 'steepness']);
export const RAMP_COUNT = 8;

function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpChannel(a, b, t) {
    return Math.round(a + (b - a) * t);
}

function lerpRgb(c0, c1, t) {
    return [lerpChannel(c0[0], c1[0], t), lerpChannel(c0[1], c1[1], t), lerpChannel(c0[2], c1[2], t)];
}

// `stops` are pre-resolved to {at (0..1), rgb} and sorted ascending by `at`,
// with the first stop at 0 and the last at 1.
function sampleContinuous(stops, f) {
    if (f <= stops[0].at) return stops[0].rgb;
    for (let i = 1; i < stops.length; i++) {
        if (f <= stops[i].at) {
            const s0 = stops[i - 1], s1 = stops[i];
            const t = (f - s0.at) / (s1.at - s0.at);
            return lerpRgb(s0.rgb, s1.rgb, t);
        }
    }
    return stops[stops.length - 1].rgb;
}

function resolveStops(rawStops) {
    return rawStops.map(s => ({ at: s.at, hex: s.hex, rgb: hexToRgb(s.hex) }));
}

// --- Ramp definitions -------------------------------------------------
//
// `powder` (row 0, SQH) is the brand ramp: deep slate ("not the goods")
// through a darkened blue-violet climb into brand pink, with the top 15% of
// the domain reserved for the bright-pink -> pale-pink transition so "pink =
// go there" is learnable in one session (§2.5 row 0). The other four stops
// split the remaining 85% evenly — the doc pins the top-15% cutoff exactly
// but not the interior spacing, so this is the plainest reading of "evenly
// stepped until the reserved top band."
//
// Luminance-monotonic by construction (§2.5: "survives the x luma
// modulation"), per frontend-design review. The doc's original six named
// hex stops were NOT monotonic: #6fc6ff (luma ~184) was brighter than the
// #c06ff2 stop immediately after it (luma ~138), which under the fragment
// shader's `layer.rgb * (0.45 + 0.55*luma)` terrain modulation (§2.6) let
// two different SQH values land on the same on-screen luminance — the
// exact glanceability failure the "monotonic" requirement exists to
// prevent. Fix, verified monotonic end to end (luma 25.4 / 63.8 / 96.2 /
// 117.5 / 142.1 / 221.9): `#6fc6ff` is sacrificed as a stop so the brand
// anchor (`#ff6b9d` / `#ffd3e8`, unchanged) can only ever sit at the top of
// the ramp. `#6fc6ff` itself is not lost from the brand — it still anchors
// the `depth` ramp and the landing page.
const POWDER_STOPS = resolveStops([
    { at: 0, hex: '#141a24' },
    { at: 0.2125, hex: '#24455e' },
    { at: 0.425, hex: '#2f6a90' },
    { at: 0.6375, hex: '#8f66c4' },
    { at: 0.85, hex: '#ff6b9d' },
    { at: 1, hex: '#ffd3e8' },
]);

// `depth` (row 2) — sequential blue -> white, evenly spaced stops. "Not
// pink: depth is context, quality is the product" (§2.5 row 2).
const DEPTH_STOPS = resolveStops([
    { at: 0, hex: '#0d1524' },
    { at: 0.25, hex: '#48597b' },
    { at: 0.5, hex: '#6fc6ff' },
    { at: 0.75, hex: '#dbe7f4' },
    { at: 1, hex: '#ffffff' },
]);

// `hazard` (row 1, avalanche severity) — 5 EAWS-shaped danger classes, hard
// steps, no interpolation: "a danger level is a class, not a gradient"
// (§2.5 row 1). The avalanche `packed_bits` layout is `{release: shift 7,
// bits 1}` + `{severity: shift 0, bits 7}` — a boolean release flag (a
// screen-space stipple in the fragment shader, not this ramp's domain) plus
// a 7-bit severity 0..127. The shader passes severity straight through as
// the LUT sample index with **no rescale** (unlike the general 1..255
// sidecar domain other ramps use), so this ramp's bins are computed
// directly over the severity range.
//
// Three-tier floor, not two: severity 0 is the general NODATA sentinel;
// severity 1 is "simulated, no hazard" — a real, confirmed-safe result,
// distinct from "we have no idea" — and will *also* be shader-guarded to
// no-tint, same as NODATA. The EAWS classes themselves only start at
// severity 2 (runout domain is [2,127], consultant-confirmed). Both 0 and 1
// render fully transparent here so the ramp's own floor can't be misread as
// "safe = vivid green" — that reading would be wrong twice over (green is
// reserved for the *lowest real danger class*, not "no danger data").
const HAZARD_SEVERITY_MAX = 127; // 7-bit field (bits 0-6)
const HAZARD_CLASS_MIN = 2; // EAWS classes start here; 0 = NODATA, 1 = simulated-no-hazard
const HAZARD_COLORS = ['#34d399', '#facc15', '#fb923c', '#f87171', '#7f1d1d'];
const HAZARD_LABELS = ['low', 'moderate', 'considerable', 'high', 'very high'];
// Row 1's "very high" class additionally gets a black stipple per §2.5 —
// that is a screen-space fragment-shader effect (same idiom as the runout
// stipple in §2.3) with no referent in a byte -> colour LUT, so it is left
// to the shader-integration task (P1.2); this module ships the solid
// `#7f1d1d` base colour the stipple would modulate.

// `surface` (row 3) — "7 discrete class colours, reserved" (§2.5 row 3): the
// doc intentionally does not pin exact hex values, and `surface` is not in
// the beta layer picker (§3.2's pill row lists only SQH/DEPTH/AVY/STEEP).
// These are placeholder categorical colours — distinct, accessible, and
// deliberately outside the pink/blue ramps already claimed by powder/depth
// — kept here only so RAMP_COUNT's row 3 is fully populated and testable.
// `index.json`'s `classes` array reserves index 0 for "-" (no class),
// which doubles as the general NODATA=0 sentinel; the 6 real classes below
// map to the general 1..255 sidecar domain (unlike `hazard`, which has its
// own narrower 0..127 severity domain — see HAZARD_SEVERITY_MAX above).
const SURFACE_COLORS = ['#38bdf8', '#a78bfa', '#fbbf24', '#22c55e', '#94a3b8', '#78716c'];
const SURFACE_LABELS = ['powder', 'wind slab', 'crust', 'wet', 'refrozen', 'rock'];

// `steepness` (row 4) mirrors the existing `gradientColor()` GLSL function
// (main.js, `setupMaterialShader`) bin-for-bin, so "Steepness" can migrate
// into the unified layer picker without a visual change (§2.5 row 4). Raw
// byte value *is* the slope in degrees here — there is no domain rescale,
// unlike the sidecar layers. Below 30 degrees `gradientColor()` is never
// even called (`uGradientMode > 0.5 && vSlope >= 30.0` guards the call
// site, main.js) — the comment on that branch reads "Transparent/Texture?"
// and the existing `.legend` markup renders that bin as a plain texture
// swatch (`index.html`, "< 30° TEXTURE"). Reproducing "without a visual
// change" therefore means alpha 0 (no tint, base texture shows through)
// for that bin, not an opaque black tint — `sidecarRamp()` only applies a
// layer at all when `layer.a > 0.0` (§2.3). RGB is still the literal
// `vec3(0.0)` the shader bin returns, in case anything reads it ignoring
// alpha.
function steepnessColorForByte(raw) {
    const s = raw;
    if (s < 30) return [0, 0, 0, 0];
    if (s < 35) return [51, 204, 51, 255];   // #33cc33
    if (s < 40) return [230, 230, 51, 255];  // #e6e633
    if (s < 45) return [255, 153, 0, 255];   // #ff9900
    if (s < 55) return [230, 51, 51, 255];   // #e63333
    return [153, 51, 204, 255];              // #9933cc
}

// Degree thresholds/colours/labels used only to build the *legend* view of
// the steepness ramp (`rampStops('steepness')`). The LUT itself (built by
// `steepnessColorForByte`) covers the full 0..255 raw-byte domain exactly
// like the shader does; for a human-readable gradient bar we clip display
// to the realistic 0-90 degree slope range instead of the full byte range,
// since bytes above ~90 are unreachable slope values and would otherwise
// squash the whole legend into the first third of the bar.
const STEEPNESS_DISPLAY_MAX_DEGREES = 90;
const STEEPNESS_LEGEND_DEGREES = [0, 30, 35, 40, 45, 55, STEEPNESS_DISPLAY_MAX_DEGREES];
const STEEPNESS_LEGEND_COLORS = ['#000000', '#33cc33', '#e6e633', '#ff9900', '#e63333', '#9933cc'];
const STEEPNESS_LEGEND_LABELS = ['< 30°', '30-35°', '35-40°', '40-45°', '45-55°', '55°+'];

const RAMP_DEFS = {
    powder: {
        kind: 'continuous',
        stops: POWDER_STOPS,
        ticks: [{ at: 0, label: 'poor' }, { at: 100, label: 'good' }],
    },
    depth: {
        kind: 'continuous',
        stops: DEPTH_STOPS,
        ticks: [{ at: 0, label: 'thin' }, { at: 100, label: 'deep' }],
    },
    hazard: {
        kind: 'hazardSeverity',
        colors: HAZARD_COLORS,
        labels: HAZARD_LABELS,
    },
    surface: {
        kind: 'categoricalEqual',
        colors: SURFACE_COLORS,
        labels: SURFACE_LABELS,
    },
    steepness: {
        kind: 'steepness',
    },
};

// --- Byte -> colour -----------------------------------------------------

function continuousColorForByte(stops, raw) {
    if (raw === NODATA_BYTE) return [0, 0, 0, 0];
    const f = (raw - 1) / 254; // domain is 1..255 (§1.1)
    const [r, g, b] = sampleContinuous(stops, f);
    return [r, g, b, 255];
}

function categoricalEqualColorForByte(colors, raw) {
    if (raw === NODATA_BYTE) return [0, 0, 0, 0];
    const f = (raw - 1) / 254;
    const n = colors.length;
    const bin = Math.min(n - 1, Math.floor(f * n));
    const [r, g, b] = hexToRgb(colors[bin]);
    return [r, g, b, 255];
}

// `raw` here is already the extracted severity (0..127, no rescale — see
// HAZARD_SEVERITY_MAX above), not a general 1..255 sidecar byte. Severity 0
// (NODATA) and severity 1 ("simulated, no hazard") both take the same
// no-tint path: the shader's `sidecarRamp()` transparency guard
// (`raw < 0.5`, §2.3) only literally catches 0, so severity 1 needs its own
// explicit guard here (and will get one in the shader too, per
// frontend-design) — this LUT ships transparent at 1 regardless, so a
// direct LUT sample (this module's own helpers, a future debug view) can
// never show "confirmed safe" as saturated green. EAWS classes are binned
// across [HAZARD_CLASS_MIN, HAZARD_SEVERITY_MAX] only.
function hazardColorForByte(colors, raw) {
    if (raw === NODATA_BYTE || raw === 1) return [0, 0, 0, 0];
    const n = colors.length;
    const severity = Math.min(raw, HAZARD_SEVERITY_MAX); // defensive clamp; raw > 127 is unreachable from a 7-bit field
    const span = HAZARD_SEVERITY_MAX - HAZARD_CLASS_MIN + 1;
    const bin = Math.min(n - 1, Math.floor(((severity - HAZARD_CLASS_MIN) / span) * n));
    const [r, g, b] = hexToRgb(colors[bin]);
    return [r, g, b, 255];
}

function colorForByte(id, raw) {
    const def = RAMP_DEFS[id];
    if (!def) throw new Error(`sidecar_colormap: unknown ramp id "${id}"`);
    switch (def.kind) {
        case 'continuous': return continuousColorForByte(def.stops, raw);
        case 'categoricalEqual': return categoricalEqualColorForByte(def.colors, raw);
        case 'hazardSeverity': return hazardColorForByte(def.colors, raw);
        case 'steepness': return steepnessColorForByte(raw);
        default: throw new Error(`sidecar_colormap: unhandled ramp kind "${def.kind}"`);
    }
}

/** Row index of `id` within the LUT (0-based). Throws on an unknown id. */
export function rampRow(id) {
    const row = RAMP_IDS.indexOf(id);
    if (row === -1) throw new Error(`sidecar_colormap: unknown ramp id "${id}"`);
    return row;
}

/**
 * Build the full LUT texture data: `Uint8Array(256 * RAMP_COUNT * 4)`, RGBA8,
 * row-major (`(row * 256 + byte) * 4 + channel`) — matching the sampling
 * math in §2.3 (`vec2((raw + 0.5) / 256.0, (rampRow + 0.5) / uSidecarRamp.y)`).
 * Reserved rows (RAMP_IDS.length .. RAMP_COUNT-1) are left fully transparent.
 */
export function buildLutData() {
    const data = new Uint8Array(256 * RAMP_COUNT * 4);
    for (let row = 0; row < RAMP_COUNT; row++) {
        const id = RAMP_IDS[row];
        for (let raw = 0; raw < 256; raw++) {
            const [r, g, b, a] = id ? colorForByte(id, raw) : [0, 0, 0, 0];
            const idx = (row * 256 + raw) * 4;
            data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = a;
        }
    }
    return data;
}

// --- Legend / CSS gradient ------------------------------------------------

function pct(fraction) {
    return Math.round(fraction * 10000) / 100;
}

function categoricalCss(colors, boundaries) {
    const parts = [];
    for (let i = 0; i < colors.length; i++) {
        parts.push(`${colors[i]} ${pct(boundaries[i])}%`, `${colors[i]} ${pct(boundaries[i + 1])}%`);
    }
    return `linear-gradient(90deg, ${parts.join(', ')})`;
}

function categoricalTicks(colors, labels, boundaries) {
    return colors.map((_, i) => ({
        at: pct((boundaries[i] + boundaries[i + 1]) / 2),
        label: labels[i],
    }));
}

/**
 * The same ramp definitions that feed the LUT, shaped for the DOM legend
 * (§2.5 / §2.7 / §3.5): `{ css, ticks, categorical }`. `css` is a CSS
 * `linear-gradient(...)` string; `ticks` are `{at: percent 0..100, label}`
 * along that same axis; `categorical` distinguishes a continuous gradient
 * (smooth swatch, two end labels) from hard-stepped classes (discrete
 * swatches, one label per class) for the legend renderer.
 */
export function rampStops(id) {
    const def = RAMP_DEFS[id];
    if (!def) throw new Error(`sidecar_colormap: unknown ramp id "${id}"`);

    if (def.kind === 'continuous') {
        const css = `linear-gradient(90deg, ${def.stops.map(s => `${s.hex} ${pct(s.at)}%`).join(', ')})`;
        return { css, ticks: def.ticks.map(t => ({ ...t })), categorical: false };
    }

    if (def.kind === 'categoricalEqual' || def.kind === 'hazardSeverity') {
        // The legend is a 0..1 axis regardless of the underlying byte
        // domain (1..255 for categoricalEqual ramps, 0..127 for hazard's
        // severity field), so both kinds divide it into n equal bins the
        // same way.
        const n = def.colors.length;
        const boundaries = Array.from({ length: n + 1 }, (_, i) => i / n);
        return {
            css: categoricalCss(def.colors, boundaries),
            ticks: categoricalTicks(def.colors, def.labels, boundaries),
            categorical: true,
        };
    }

    // steepness
    const boundaries = STEEPNESS_LEGEND_DEGREES.map(d => d / STEEPNESS_DISPLAY_MAX_DEGREES);
    return {
        css: categoricalCss(STEEPNESS_LEGEND_COLORS, boundaries),
        ticks: categoricalTicks(STEEPNESS_LEGEND_COLORS, STEEPNESS_LEGEND_LABELS, boundaries),
        categorical: true,
    };
}
