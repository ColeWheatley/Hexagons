// Generates an explicit fixed-width sampler switch. WebGL implementations do
// not consistently support dynamically indexed sampler arrays, so every page
// slot is a named branch in the final GLSL program.

export const MAX_TEXTURE_PAGE_BINDINGS = 9;

export function buildTexturePageShaderSwitch(bindingCount = MAX_TEXTURE_PAGE_BINDINGS) {
    if (!(Number.isInteger(bindingCount) && bindingCount >= 1 && bindingCount <= 16)) {
        throw new RangeError('bindingCount must be an integer from 1 to 16');
    }
    const samplerDeclarations = Array.from(
        { length: bindingCount - 1 },
        (_, index) => `uniform sampler2D uPageMap${index + 1};`,
    ).join('\n                ');
    const originDeclarations = Array.from(
        { length: bindingCount },
        (_, index) => `uniform vec2 uPageOrigin${index};`,
    ).join('\n                ');
    const validityDeclarations = Array.from(
        { length: bindingCount },
        (_, index) => `uniform float uPageValid${index};`,
    ).join('\n                ');
    const samplingBranches = Array.from(
        { length: bindingCount },
        (_, slot) => `${slot === 0 ? 'if' : 'else if'} (uPageValid${slot} > 0.5 &&
                        all(greaterThanEqual(sourceXY, uPageOrigin${slot})) &&
                        all(lessThan(sourceXY, uPageOrigin${slot} + vec2(uPageSize)))) {
                        texColor = texture2D(${slot === 0 ? 'map' : `uPageMap${slot}`},
                            (sourceXY - uPageOrigin${slot}) / uPageSize);
                        sampledPage = true;
                    }`,
    ).join(' ');
    return Object.freeze({
        declarations: `${samplerDeclarations}
                ${originDeclarations}
                ${validityDeclarations}
                uniform float uPageSize;
                uniform vec2 uSourceOrigin;`,
        samplingBranches,
    });
}
