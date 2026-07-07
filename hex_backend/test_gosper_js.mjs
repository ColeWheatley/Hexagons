// @atlas: Node.js diagnostic script that prints Gosper curve offsets from the canonical frontend implementation (frontend/app/gosper_core.js) for eyeball comparison with hex_backend/test_gosper.py. The full byte-exact cross-language gate lives in tests/gosper/run_parity.sh — this is just the quick human-readable spot check.
// NOTE: the original inline matrix here, (2q + r, -q + 3r), was NOT a
// similarity under the app's axial->world convention (it sheared islands).
// The canonical conformal matrix is M(q,r) = (2q - r, q + 3r), defined once
// in gosper_core.js / coordinate_utility.py.
import '../frontend/app/gosper_core.js';

const G = globalThis.GosperCore;

console.log('=== JAVASCRIPT GOSPER OFFSET TEST (canonical gosper_core.js) ===\n');
for (let j = 0; j < 7; j++) {
    const [sq, sr] = G.mulMPow(G.NEIGHBORS[j][0], G.NEIGHBORS[j][1], 4);
    console.log(`Level 5, child ${j}: base(${G.NEIGHBORS[j][0]},${G.NEIGHBORS[j][1]}) -> shift(${sq},${sr})`);
}

const off = G.offsets(5);
const fmt = (i) => `(${off[i * 2]},${off[i * 2 + 1]})`;
const range = (a, b) => Array.from({ length: b - a }, (_, k) => fmt(a + k)).join(', ');

console.log('\nFirst 7 offsets:', range(0, 7));
console.log('Offsets 2401-2407:', range(2401, 2408));
console.log('Last 7 offsets:', range(16800, 16807));
console.log('Total offsets:', off.length / 2);
