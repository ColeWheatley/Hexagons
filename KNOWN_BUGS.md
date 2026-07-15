# Known Bugs

## 2026-07-07

- Sintered-mode texture blur after panning: sometimes the app swaps from pan/moving mode into sintered mode and textures appear blurry or low-quality only after settling. Likely source patched: sintered LOD materials created after movement were not registered in `tile.clonedMaterials`, so later full-res texture upgrades could miss exactly the settled-only meshes. Verify on-device. Bias toward prioritizing full-res textures whenever VRAM budget allows; compressed high-res textures should mostly be memory-bound, not frame-rate-bound.
- Sintered-mode FPS readout reports roughly 2-4 FPS. Investigate whether this is just a misleading static/idle FPS metric or whether the app is needlessly rendering or doing background work and wasting battery.
- Rotation behavior is non-intuitive. Pending UX discussion before changing controls.
