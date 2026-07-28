// PowFinder sidecar GLSL, spliced into the shared LOD material's
// vertex/fragment shaders by setupMaterialShader() (main.js). Kept as plain
// exported strings, one reviewable place, mirroring texture_page_shader.js's
// pattern (though these need no per-material parameterization, so they're
// constants rather than a builder function).
//
// .mjs, not .js: every new PowFinder module is .mjs (frontend-design ruling
// on the P0.1 handoff) -- a plain .js file using `export` syntax cannot be
// imported by `node --test` under this app's package.json ("type":
// "commonjs"), and main.js's `import './x.mjs'` works identically to `.js`
// once esbuild bundles it, so there's no browser-side cost to the extension.
//
// Placement in main.js (design doc §2.2/§2.3, both verified against the
// current source, not assumed from the doc alone):
//   SIDECAR_VERTEX_DECLARATIONS  -> end of the `#include <common>` vertex block
//   SIDECAR_VERTEX_FETCH         -> immediately after `vInstDist = instDist;`,
//                                    inside `#ifdef USE_INSTANCING`, before
//                                    `#else` -- i.e. after the CDLOD cut
//                                    (`gl_Position = vec4(0.0,0.0,0.0,1.0); return;`)
//                                    so culled instances pay nothing, and
//                                    before the isCap/skirt branch.
//   SIDECAR_FRAGMENT_DECLARATIONS -> end of the `#include <common>` fragment block
//   SIDECAR_FRAGMENT_TINT         -> inside fragmentMapPatch, after the
//                                    existing `vec3 baseColor = ...` /
//                                    slope-gradient block, before
//                                    `vec3 finalColor = baseColor * lighting;`

export const SIDECAR_VERTEX_DECLARATIONS = `
                uniform sampler2D uSidecarAtlas;
                uniform vec2  uSidecarTexel;    // (1/atlasWidth, 1/atlasHeight)
                uniform vec2  uSidecarGeom;     // (atlasWidth, 1/atlasWidth)
                uniform float uSidecarRowBase;  // per-tile: slot * 3
                uniform float uSidecarValid;    // per-tile: 0 = plain terrain
                varying vec4  vSidecarRaw;      // four layer bytes, 0..255`;

export const SIDECAR_VERTEX_FETCH = `
                // --- POWFINDER SIDECAR FETCH ---
                // instanceNZ_2.w carries this node's tile-pyramid address
                // (0..2800), written by tile_worker.js buildLevelBuffers()
                // (design doc §1.6). Unit nodes resolve to their L1 parent —
                // the sidecar has no finer granularity. Placed after the
                // CDLOD cut above so degenerate/culled instances pay nothing.
                vSidecarRaw = vec4(0.0);
                if (uSidecarValid > 0.5) {
                    float addr = instanceNZ_2.w;
                    float arow = floor(addr * uSidecarGeom.y);
                    float acol = addr - arow * uSidecarGeom.x;
                    vec2  auv  = vec2((acol + 0.5) * uSidecarTexel.x,
                                      (uSidecarRowBase + arow + 0.5) * uSidecarTexel.y);
                    vSidecarRaw = texture2D(uSidecarAtlas, auv) * 255.0;
                }`;

export const SIDECAR_FRAGMENT_DECLARATIONS = `
                uniform sampler2D uSidecarLut;
                uniform vec4  uSidecarChannel;   // one-hot mask selecting the primary layer
                uniform vec4  uSidecarOverlayCh; // one-hot mask for the overlay, all-zero = off
                uniform vec2  uSidecarRamp;      // (rampRow, rampCount)
                uniform float uSidecarMode;      // 0 off | 1 continuous/class | 2 packed_bits
                uniform vec2  uSidecarMix;       // (capMix, skirtMix)
                uniform float uSidecarOpacity;
                varying vec4  vSidecarRaw;

                // Ramp lookup. raw/value 0 is the reserved NODATA sentinel in
                // every layer: it must never paint, or every hole in the
                // model reads as a confident value.
                vec4 sidecarRamp(float raw, float rampRow) {
                    if (raw < 0.5) return vec4(0.0);
                    return vec4(texture2D(uSidecarLut, vec2((raw + 0.5) / 256.0,
                                                            (rampRow + 0.5) / uSidecarRamp.y)).rgb, 1.0);
                }

                // packed_bits decode (avalanche): bit 7 = release flag, bits
                // 0-6 = severity. This is the confirmed layout (release @
                // shift 7 / 1 bit, severity @ shift 0 / 7 bits) -- NOT the
                // release/runout (mod 32 / div 32) split originally drafted
                // in the design doc, which does not match what P0.1 shipped.
                float sidecarSeverity(float raw) { return mod(raw, 128.0); }
                float sidecarRelease(float raw)  { return step(128.0, raw); }`;

export const SIDECAR_FRAGMENT_TINT = `
                // --- POWFINDER LAYER TINT ---
                // House rule: caps stay imagery-toned. In flat 2D every
                // skirt collapses to a zero-area quad (uHeightFactor -> 0),
                // so the cap is the only surface that exists; the tint
                // therefore crossfades cap -> skirt as the piston rises.
                float layerMix = (vIsTop > 0.5) ? uSidecarMix.x : uSidecarMix.y;
                if (uSidecarMode > 0.5 && layerMix > 0.0) {
                    float raw = dot(vSidecarRaw, uSidecarChannel);
                    bool packed = (uSidecarMode > 1.5 && uSidecarMode < 2.5);
                    // Packed layers (avalanche): the ramp is fed severity,
                    // decoded from the low 7 bits -- not the raw byte, which
                    // also carries the release flag in bit 7.
                    float value = packed ? sidecarSeverity(raw) : raw;
                    // severity 0 is NODATA (caught by sidecarRamp's raw<0.5
                    // guard via the same decode, since mod(0,128)=0); severity
                    // 1 is the harmonized hazard contract's own "simulated,
                    // no hazard" sentinel (snow_backend/avalanche/config.py)
                    // -- it must ALSO render untinted, or every
                    // modeled-benign cell paints the bottom of the hazard
                    // ramp as if it were a real (if minor) reading.
                    vec4 layer = (packed && value < 1.5) ? vec4(0.0) : sidecarRamp(value, uSidecarRamp.x);
                    if (layer.a > 0.0) {
                        // Modulate the ramp by aerial luminance rather than
                        // replacing it, so ridges, gullies and shadows stay
                        // legible through the tint. This is what keeps the
                        // map navigable instead of a flat choropleth.
                        float luma = dot(texColor.rgb, vec3(0.2126, 0.7152, 0.0722));
                        vec3 tinted = layer.rgb * (0.45 + 0.55 * luma);

                        if (packed) {
                            // Release is the "could start here" half of the
                            // avalanche encoding: same severity colour, a
                            // screen-space diagonal stipple laid over it --
                            // the standard hazard-map idiom, and it survives
                            // being painted on a 17 m hexagon. Boolean, not
                            // graded: a cell either is or isn't a release
                            // zone.
                            float released = sidecarRelease(raw);
                            float stripe = step(0.5, fract((gl_FragCoord.x + gl_FragCoord.y) * 0.08));
                            vec3  faded  = mix(vec3(dot(tinted, vec3(0.3333))), tinted, 0.45);
                            tinted = mix(tinted, mix(faded * 0.7, faded, stripe), released);
                        }
                        baseColor = mix(baseColor, tinted, layerMix * uSidecarOpacity);
                    }

                    // Optional second channel, drawn as a thin hazard edge on
                    // the upper skirt band so it reads over any primary ramp
                    // without a second colour scale.
                    float ov = dot(vSidecarRaw, uSidecarOverlayCh);
                    if (ov > 0.5 && vIsTop < 0.5 && vSkirtY < 0.22) {
                        float ovSeverity = sidecarSeverity(ov);
                        vec4 oc = (ovSeverity < 1.5) ? vec4(0.0) : sidecarRamp(ovSeverity, uSidecarRamp.x + 1.0);
                        if (oc.a > 0.0) baseColor = mix(baseColor, oc.rgb, 0.85 * uSidecarMix.y);
                    }
                }`;
