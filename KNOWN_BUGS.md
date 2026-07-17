# Known Bugs

## 2026-07-07

- Sintered-mode texture blur after panning: sometimes the app swaps from pan/moving mode into sintered mode and textures appear blurry or low-quality only after settling. Likely source patched: sintered LOD materials created after movement were not registered in `tile.clonedMaterials`, so later full-res texture upgrades could miss exactly the settled-only meshes. Verify on-device. Bias toward prioritizing full-res textures whenever VRAM budget allows; compressed high-res textures should mostly be memory-bound, not frame-rate-bound.
- Fixed 2026-07-17: FPS readout now shows `IDLE` while the render-on-demand path is settled, and numeric FPS is computed only from active render frames.
- Rotation behavior is non-intuitive. Pending UX discussion before changing controls.
