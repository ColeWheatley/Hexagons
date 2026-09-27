// @atlas: Progressive KTX2 access. A KTX2 file stores its mip levels
// smallest-first with an explicit level index, so any byte prefix of a
// published page that covers levels L..N-1 can be rewritten into a small,
// fully valid standalone KTX2 whose base level is mip L. Transcoder output for
// every shared level is byte-identical to transcoding the whole file (verified
// for XUASTC LDR 8x6 -> ASTC 8x6 and BC7, basisu 2.10). This lets the viewer
// fetch 28 KB for a 256 px page, 400 KB for 1024 px, 1.6 MB for 2048 px, and
// only ever the full ~6.4 MB where 4096 px is actually visible — from the
// same immutable objects, with HTTP Range requests, and no rebake.
//
// Loaded two ways from one file (do not convert to an ES module): the tile
// worker bundles/imports it as a classic script, tests import it for its
// side effect and read globalThis.Ktx2Prefix.
(function (root) {
    const IDENTIFIER = [0xAB, 0x4B, 0x54, 0x58, 0x20, 0x32, 0x30, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A];
    const FIXED_HEADER_BYTES = 80;
    // Supercompression schemes whose global data is a flat per-image table
    // with no absolute offsets (basisu 2.x XUASTC LDR writes scheme 5 with a
    // 12-byte record per mip). None (0) has no global data at all.
    const PER_IMAGE_SGD_SCHEMES = new Set([5]);

    function u32(view, offset) { return view.getUint32(offset, true); }
    function u64(view, offset) { return Number(view.getBigUint64(offset, true)); }

    function hasIdentifier(bytes) {
        if (bytes.byteLength < IDENTIFIER.length) return false;
        for (let i = 0; i < IDENTIFIER.length; i++) if (bytes[i] !== IDENTIFIER[i]) return false;
        return true;
    }

    /**
     * Bytes needed from the start of the file before parseHeader() can
     * succeed. With fewer than 80 bytes the level count is unknown, so 80 is
     * returned; callers normally fetch a generous first range anyway.
     */
    function headerBytesNeeded(bytes) {
        if (!bytes || bytes.byteLength < FIXED_HEADER_BYTES) return FIXED_HEADER_BYTES;
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const levels = Math.max(1, u32(view, 40));
        const indexEnd = FIXED_HEADER_BYTES + 24 * levels;
        if (bytes.byteLength < indexEnd) return indexEnd;
        const dfdEnd = u32(view, 48) + u32(view, 52);
        const kvdEnd = u32(view, 56) + u32(view, 60);
        const sgdEnd = u64(view, 64) + u64(view, 72);
        return Math.max(indexEnd, dfdEnd, kvdEnd, sgdEnd);
    }

    /** Parse the header/index. Returns null if more bytes are needed. */
    function parseHeader(bytes) {
        if (!hasIdentifier(bytes)) {
            if (bytes && bytes.byteLength >= IDENTIFIER.length) throw new Error('Not a KTX2 file');
            return null;
        }
        if (bytes.byteLength < headerBytesNeeded(bytes)) return null;
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const header = {
            vkFormat: u32(view, 12), typeSize: u32(view, 16),
            width: u32(view, 20), height: u32(view, 24), depth: u32(view, 28),
            layers: u32(view, 32), faces: u32(view, 36), levels: Math.max(1, u32(view, 40)),
            scheme: u32(view, 44),
            dfdOffset: u32(view, 48), dfdLength: u32(view, 52),
            kvdOffset: u32(view, 56), kvdLength: u32(view, 60),
            sgdOffset: u64(view, 64), sgdLength: u64(view, 72),
            levelIndex: [],
            headerEnd: headerBytesNeeded(bytes),
            // Total file size is not in the header; callers learn it from
            // Content-Range and may store it here.
            fileSize: null,
        };
        for (let i = 0; i < header.levels; i++) {
            const base = FIXED_HEADER_BYTES + 24 * i;
            header.levelIndex.push({ offset: u64(view, base), length: u64(view, base + 8), uncompressed: u64(view, base + 16) });
        }
        return header;
    }

    /** Exclusive end offset of the smallest prefix holding levels >= baseLevel. */
    function prefixEndForLevel(header, baseLevel) {
        const level = Math.max(0, Math.min(header.levels - 1, baseLevel));
        let end = header.headerEnd;
        for (let i = level; i < header.levels; i++) {
            const entry = header.levelIndex[i];
            end = Math.max(end, entry.offset + entry.length);
        }
        return end;
    }

    /** Finest (lowest-index) base level fully contained in the first `byteCount` bytes, or -1. */
    function levelForPrefix(header, byteCount) {
        if (byteCount < header.headerEnd) return -1;
        let best = -1;
        for (let level = header.levels - 1; level >= 0; level--) {
            if (prefixEndForLevel(header, level) <= byteCount) best = level;
            else break;
        }
        return best;
    }

    function levelSize(header, level) {
        return {
            width: Math.max(1, header.width >> level),
            height: Math.max(1, header.height >> level),
        };
    }

    /**
     * Build a standalone KTX2 whose base level is `baseLevel` of the source.
     * `bytes` must hold at least prefixEndForLevel(header, baseLevel) bytes.
     * Returns the input unchanged (no copy) when baseLevel is 0 and the
     * prefix is the whole file.
     */
    function rebase(bytes, header, baseLevel) {
        const level = Math.max(0, Math.min(header.levels - 1, baseLevel));
        const need = prefixEndForLevel(header, level);
        if (bytes.byteLength < need) {
            throw new Error(`KTX2 prefix too short for level ${level}: have ${bytes.byteLength}, need ${need}`);
        }
        if (level === 0 && header.fileSize !== null && bytes.byteLength === header.fileSize) return bytes;
        if (header.depth > 1 || header.faces !== 1 || header.layers > 1) {
            throw new Error('Progressive KTX2 rebase supports single 2D images only');
        }
        let sgdStride = 0;
        if (header.sgdLength > 0) {
            if (!PER_IMAGE_SGD_SCHEMES.has(header.scheme)) {
                throw new Error(`Progressive KTX2 rebase does not support supercompression scheme ${header.scheme}`);
            }
            sgdStride = header.sgdLength / header.levels;
            if (!Number.isInteger(sgdStride) || sgdStride <= 0) {
                throw new Error(`Unexpected KTX2 global-data layout (${header.sgdLength} B for ${header.levels} levels)`);
            }
        }
        const count = header.levels - level;
        const align8 = value => Math.ceil(value / 8) * 8;
        const dfdOffset = FIXED_HEADER_BYTES + 24 * count;
        const kvdOffset = dfdOffset + header.dfdLength;
        const sgdOffset = header.sgdLength > 0 ? align8(kvdOffset + header.kvdLength) : 0;
        const sgdLength = sgdStride * count;
        let cursor = header.sgdLength > 0 ? sgdOffset + sgdLength : kvdOffset + header.kvdLength;
        // Supercompressed payloads need no alignment; raw formats need
        // lcm(texel block size, 4). Only supercompressed input is accepted
        // above, but keep smallest-first ordering exactly like the source.
        const placements = [];
        for (let src = header.levels - 1; src >= level; src--) {
            placements.push({ src, dst: cursor, length: header.levelIndex[src].length });
            cursor += header.levelIndex[src].length;
        }
        const out = new Uint8Array(cursor);
        const view = new DataView(out.buffer);
        out.set(bytes.subarray(0, 12), 0);
        const size = levelSize(header, level);
        view.setUint32(12, header.vkFormat, true);
        view.setUint32(16, header.typeSize, true);
        view.setUint32(20, size.width, true);
        view.setUint32(24, header.height === 0 ? 0 : size.height, true);
        view.setUint32(28, header.depth, true);
        view.setUint32(32, header.layers, true);
        view.setUint32(36, header.faces, true);
        view.setUint32(40, count, true);
        view.setUint32(44, header.scheme, true);
        view.setUint32(48, dfdOffset, true);
        view.setUint32(52, header.dfdLength, true);
        view.setUint32(56, header.kvdLength > 0 ? kvdOffset : 0, true);
        view.setUint32(60, header.kvdLength, true);
        view.setBigUint64(64, BigInt(sgdOffset), true);
        view.setBigUint64(72, BigInt(sgdLength), true);
        for (const placement of placements) {
            const entry = header.levelIndex[placement.src];
            const base = FIXED_HEADER_BYTES + 24 * (placement.src - level);
            view.setBigUint64(base, BigInt(placement.dst), true);
            view.setBigUint64(base + 8, BigInt(placement.length), true);
            view.setBigUint64(base + 16, BigInt(entry.uncompressed), true);
            out.set(bytes.subarray(entry.offset, entry.offset + placement.length), placement.dst);
        }
        out.set(bytes.subarray(header.dfdOffset, header.dfdOffset + header.dfdLength), dfdOffset);
        if (header.kvdLength > 0) {
            out.set(bytes.subarray(header.kvdOffset, header.kvdOffset + header.kvdLength), kvdOffset);
        }
        if (header.sgdLength > 0) {
            const from = header.sgdOffset + sgdStride * level;
            out.set(bytes.subarray(from, header.sgdOffset + header.sgdLength), sgdOffset);
        }
        return out;
    }

    root.Ktx2Prefix = {
        FIXED_HEADER_BYTES,
        headerBytesNeeded,
        parseHeader,
        prefixEndForLevel,
        levelForPrefix,
        levelSize,
        rebase,
    };
})(typeof self !== 'undefined' ? self : globalThis);
