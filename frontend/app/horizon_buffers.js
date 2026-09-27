// Matrix storage is column-major, matching Three.js InstancedMesh.setMatrixAt.
// Filling the array directly avoids constructing a Matrix4 for each island.
export function writeHorizonMatrix(array, index, xz, x, z, hidden = false) {
    const at = index * 16;
    array[at] = hidden ? 0 : xz.a;
    array[at + 1] = 0;
    array[at + 2] = hidden ? 0 : xz.c;
    array[at + 3] = 0;
    array[at + 4] = 0;
    array[at + 5] = hidden ? 0 : 1;
    array[at + 6] = 0;
    array[at + 7] = 0;
    array[at + 8] = hidden ? 0 : xz.b;
    array[at + 9] = 0;
    array[at + 10] = hidden ? 0 : xz.d;
    array[at + 11] = 0;
    array[at + 12] = hidden ? 0 : x;
    array[at + 13] = 0;
    array[at + 14] = hidden ? 0 : z;
    array[at + 15] = 1;
}

export function markHorizonMatrixRange(attribute, first, count = 1) {
    attribute.addUpdateRange(first * 16, count * 16);
    attribute.needsUpdate = true;
}
