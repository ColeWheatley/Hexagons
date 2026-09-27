# Progressive GSP3 terrain

GSP3 terrain uses exclusive prefix ends of 952, 6,444, 44,864, and 280,166 bytes for depths 2 through 5. Motion requests depth 2. Settled requests follow the 10/5/2 km bands, with the geometry planner's L3 radius and relief margin plus a conservative root-to-L3 offset. The deepest depth actually selected by the L3 frontier also raises the requested depth. This can request detail slightly before its distance band; it prevents a near-edge gap when root and L3 distance metrics differ.

The existing per-tile `uFinestBuilt` shader uniform and mesh submission gate extend the finest built level to the camera. They cover a tile while missing levels download. A refinement constructs a detached replacement and swaps it only after the view epoch, mode, and selection/depth signature still match. Moving mode continues to show skirtless L3 caps; settled mode shows skirted detail where available. The slope-color branch remains restricted to skirts.

The main-thread visibility planner visits only depths 0–2. Tile residency therefore retains those 57 decoded records and the finest available height array for camera clearance. It no longer retains depth-3..5 visibility records or unit edge arrays. When units are absent, the unit index maps to its depth-2/3/4 ancestor for an interim elevation. Unit heights replace that estimate after depth 5 arrives.

The byte store shares the texture scheduler and persists prefix growth in a separate Cache Storage namespace. An origin that answers a Range request with the whole file is handled by the store. If prefix fetch or build fails, the existing worker full-file path recovers the tile. GSP1 and GSP2 still use their original worker fetch and build paths.

Browser rendering was intentionally left to the orchestrator, as required by `GEO_BRIEF.md`; verification here is the Node suites and a build to `tmp/dist`.
