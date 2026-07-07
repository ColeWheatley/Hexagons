# HEX4 Harness Findings

These are observations about the current writer/parser. The harness tests the behavior as-is and does not fix them.

## Duplicate Record Packing

`hex_backend/waffle_iron.py` packs each 16-byte record twice with the same format string and offset:

| lines | evidence |
| --- | --- |
| `656-660` | first `struct.pack_into("<bbHhhhBBBBBx", buf, i*16, ...)` |
| `681-685` | second identical `struct.pack_into("<bbHhhhBBBBBx", buf, i*16, ...)` |

This appears harmless because the second call overwrites the same bytes with the same values, but it is redundant and worth preserving as current-format reality.

## JS Tail Bytes Are Silent

`frontend/app/tile_worker.js` reads four layers and returns at line `152` without checking that `offset === buffer.byteLength`. `test_corruption.py` appends garbage tail bytes and confirms the JS parser accepts the file while strict structural validation rejects it.

## Delta Sampling Is Floating-Point Sensitive

The writer’s delta sampling can depend on tiny floating-point differences at DEM pixel boundaries. The semantic suite matches the current implementation exactly: center heights use `rasterio.transform.rowcol`, neighbor heights use the writer’s fast inverse transform, and SE/S/SW neighbor coordinates preserve the writer’s `odx`/`ody` grouping before adding to the center.
