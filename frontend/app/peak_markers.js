// @atlas: Peak/ski-area marker overlay. Five swappable idle+highlight styles
// drawn onto canvas textures and rendered as always-camera-facing THREE.Sprites.
// Idle peaks are elevation-filtered to keep the view uncluttered; ski areas
// (only ~14 of them) always render with one fixed, distinct marker.
// Vertical placement reuses the viewer's shared heightFactor/floorOffset
// uniforms so markers rise and settle exactly in sync with the terrain's own
// flatten-to-relief animation, with no per-frame JS needed for that part.
import * as THREE from 'three';
import { initProjection, latLonToWorld } from './coordinate_utility.js';

const IDLE_PEAK_ELEVATION_LIMIT = 700; // top-N tallest peaks shown when idle
const SKI_COLOR = '#ff6b9d';

function makeCanvas(size) {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    return c;
}

function textureFromCanvas(canvas) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
}

// --- Peak style drawers -----------------------------------------------
// Each returns a canvas. `selected` variants are brighter/larger/labelled.

function drawDot(selected) {
    const size = selected ? 160 : 96;
    const c = makeCanvas(size);
    const ctx = c.getContext('2d');
    const cx = size / 2, cy = size / 2;
    if (selected) {
        const glow = ctx.createRadialGradient(cx, cy, size * 0.08, cx, cy, size * 0.5);
        glow.addColorStop(0, 'rgba(255,214,102,0.95)');
        glow.addColorStop(0.4, 'rgba(255,180,60,0.55)');
        glow.addColorStop(1, 'rgba(255,180,60,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.14, 0, Math.PI * 2);
        ctx.fillStyle = '#fff3d6';
        ctx.fill();
        ctx.lineWidth = size * 0.035;
        ctx.strokeStyle = '#ffd666';
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.16, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fill();
    }
    return c;
}

function drawFlag(selected) {
    const size = selected ? 160 : 96;
    const c = makeCanvas(size);
    const ctx = c.getContext('2d');
    const baseX = size * 0.32, baseY = size * 0.92, topY = size * 0.12;
    ctx.strokeStyle = selected ? '#f1f5f9' : 'rgba(226,232,240,0.5)';
    ctx.lineWidth = size * (selected ? 0.03 : 0.02);
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.lineTo(baseX, topY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(baseX, topY);
    ctx.lineTo(baseX + size * 0.46, topY + size * 0.16);
    ctx.lineTo(baseX, topY + size * 0.32);
    ctx.closePath();
    if (selected) {
        ctx.fillStyle = '#ff8fab';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = size * 0.02;
        ctx.stroke();
    } else {
        ctx.fillStyle = 'rgba(255,143,171,0.45)';
        ctx.fill();
    }
    return c;
}

function drawRing(selected) {
    const size = selected ? 176 : 96;
    const c = makeCanvas(size);
    const ctx = c.getContext('2d');
    const cx = size / 2, cy = size / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.36, 0, Math.PI * 2);
    ctx.lineWidth = size * (selected ? 0.05 : 0.025);
    ctx.strokeStyle = selected ? 'rgba(116,220,255,0.95)' : 'rgba(148,220,255,0.4)';
    ctx.stroke();
    if (selected) {
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.36 * 0.6, 0, Math.PI * 2);
        ctx.lineWidth = size * 0.025;
        ctx.strokeStyle = 'rgba(116,220,255,0.55)';
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.07, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(148,220,255,0.35)';
        ctx.fill();
    }
    return c;
}

function drawCross(selected) {
    const size = selected ? 160 : 96;
    const c = makeCanvas(size);
    const ctx = c.getContext('2d');
    const cx = size / 2, cy = size * 0.58;
    ctx.strokeStyle = selected ? '#ffe8b3' : 'rgba(255,232,179,0.5)';
    ctx.lineWidth = size * (selected ? 0.09 : 0.055);
    ctx.lineCap = 'round';
    const armV = size * 0.34, armH = size * 0.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - armV);
    ctx.lineTo(cx, cy + armV * 0.5);
    ctx.moveTo(cx - armH, cy - armV * 0.35);
    ctx.lineTo(cx + armH, cy - armV * 0.35);
    ctx.stroke();
    if (selected) {
        ctx.beginPath();
        ctx.arc(cx, cy - armV, size * 0.05, 0, Math.PI * 2);
        ctx.fillStyle = '#ffe8b3';
        ctx.fill();
    }
    return c;
}

// Canvas width is sized to the actual measured text so long peak names never
// clip; the sprite's world-space scale is then derived from the canvas's own
// aspect ratio (see makeLabelSprite) instead of assuming a fixed box size.
function drawLabelText(text, selected) {
    const font = `${selected ? '700' : '500'} ${selected ? 34 : 18}px 'Outfit', sans-serif`;
    const measureCtx = document.createElement('canvas').getContext('2d');
    measureCtx.font = font;
    const textWidth = measureCtx.measureText(text).width;

    const paddingX = selected ? 28 : 12;
    const h = selected ? 96 : 40;
    const w = Math.ceil(textWidth) + paddingX * 2;

    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (selected) {
        const bh = 48;
        ctx.fillStyle = 'rgba(15,23,42,0.75)';
        ctx.beginPath();
        ctx.roundRect(0, (h - bh) / 2, w, bh, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,214,102,0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#fff3d6';
    } else {
        ctx.fillStyle = 'rgba(226,232,240,0.42)';
    }
    ctx.fillText(text, w / 2, h / 2 + (selected ? 2 : 0));
    return c;
}

function drawSkiMarker(selected) {
    const size = selected ? 150 : 88;
    const c = makeCanvas(size);
    const ctx = c.getContext('2d');
    const cx = size / 2, cy = size / 2, r = size * 0.28;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = selected ? SKI_COLOR : 'rgba(255,107,157,0.55)';
    ctx.fillRect(-r, -r, r * 2, r * 2);
    if (selected) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = size * 0.04;
        ctx.strokeRect(-r, -r, r * 2, r * 2);
    }
    ctx.restore();
    return c;
}

// --- Style registry ------------------------------------------------------
export const PEAK_MARKER_STYLES = [
    { id: 1, name: 'Minimal Dot', draw: drawDot, idleWorldSize: 26, selectedWorldSize: 60, animate: 'glow', showLabelOnSelect: true },
    { id: 2, name: 'Flag Pennant', draw: drawFlag, idleWorldSize: 30, selectedWorldSize: 64, animate: null, showLabelOnSelect: true },
    { id: 3, name: 'Topo Ring', draw: drawRing, idleWorldSize: 34, selectedWorldSize: 76, animate: 'pulse', showLabelOnSelect: true },
    { id: 4, name: 'Floating Label', draw: null, idleWorldSize: 60, selectedWorldSize: 130, animate: null, isLabelStyle: true },
    { id: 5, name: 'Alpine Cross', draw: drawCross, idleWorldSize: 30, selectedWorldSize: 66, animate: 'bounce', showLabelOnSelect: true },
];

export class PeakMarkers {
    constructor(viewer) {
        this.viewer = viewer;
        this.enabled = false;
        this.styleId = 1;
        this.loaded = false;
        this.loadPromise = null;

        this.group = new THREE.Group();
        this.group.visible = false;
        viewer.scene.add(this.group);

        this.skiGroup = new THREE.Group();
        viewer.scene.add(this.skiGroup);

        this.peakSprites = []; // one per style: array of {sprite, item}
        this.styleGroups = new Map(); // styleId -> THREE.Group
        this.labelTextureCache = new Map(); // `${name}|${selected}` -> texture

        this.highlightSprite = null;
        this.highlightLabel = null;
        this.highlightItem = null;
        this._animRunning = false;
        this._animStart = 0;
        this._boundAnimate = (t) => this._animateHighlight(t);
        this._lastSyncedHeightFactor = null;
        this.startElevationSync();
    }

    async load() {
        if (this.loaded) return;
        if (this.loadPromise) return this.loadPromise;

        this.loadPromise = (async () => {
            await initProjection();
            const res = await fetch('assets/search_index.json');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const idx = await res.json();
            if (idx.version !== 1 || !Array.isArray(idx.items)) throw new Error('Unsupported search index format');

            const rows = idx.items.map(r => ({
                name: r[0], ele: r[2], lat: r[3], lon: r[4],
                type: r[5] === 's' ? 'ski' : 'peak',
                available: r[6] === 1, x: r[7], y: r[8],
            }));

            const peaks = rows.filter(r => r.type === 'peak' && r.ele > 0)
                .sort((a, b) => b.ele - a.ele)
                .slice(0, IDLE_PEAK_ELEVATION_LIMIT);
            const skiAreas = rows.filter(r => r.type === 'ski');

            for (const item of [...peaks, ...skiAreas]) {
                const pos = (Number.isFinite(item.x) && Number.isFinite(item.y))
                    ? { x: item.x, y: item.y }
                    : latLonToWorld(item.lat, item.lon);
                item.worldX = pos.x;
                item.worldY = pos.y;
            }

            this.idlePeaks = peaks;
            this.idleSkiAreas = skiAreas;
            this._buildStyleGroups();
            this._buildSkiMarkers();
            this.loaded = true;
        })();

        try {
            return await this.loadPromise;
        } catch (e) {
            console.error('PeakMarkers load error:', e);
        } finally {
            this.loadPromise = null;
        }
    }

    _localXZ(item) {
        const o = this.viewer.worldOrigin || { x: 0, y: 0 };
        return { x: item.worldX - o.x, z: -(item.worldY - o.y) };
    }

    _makeSpriteMaterial(canvas) {
        return new THREE.SpriteMaterial({
            map: textureFromCanvas(canvas),
            depthTest: true,
            depthWrite: false,
            transparent: true,
            sizeAttenuation: true,
        });
    }

    // Text canvases are sized to their own content (see drawLabelText), so
    // the sprite's world-space width is derived from the canvas aspect ratio
    // rather than a fixed multiplier — long peak names no longer clip.
    _makeLabelSprite(text, selected, targetWorldHeight) {
        const canvas = drawLabelText(text, selected);
        const mat = new THREE.SpriteMaterial({ map: textureFromCanvas(canvas), transparent: true, depthWrite: false });
        const sprite = new THREE.Sprite(mat);
        const aspect = canvas.width / canvas.height;
        sprite.scale.set(targetWorldHeight * aspect, targetWorldHeight, 1);
        return sprite;
    }

    _buildStyleGroups() {
        for (const style of PEAK_MARKER_STYLES) {
            const group = new THREE.Group();
            group.visible = style.id === this.styleId;

            let idleMat = null;
            if (!style.isLabelStyle) {
                idleMat = this._makeSpriteMaterial(style.draw(false));
            }

            for (const item of this.idlePeaks) {
                const { x, z } = this._localXZ(item);
                let sprite;
                if (style.isLabelStyle) {
                    sprite = this._makeLabelSprite(item.name, false, style.idleWorldSize * 0.55);
                } else {
                    sprite = new THREE.Sprite(idleMat);
                    sprite.scale.set(style.idleWorldSize, style.idleWorldSize, 1);
                }
                sprite.position.set(x, this._elevationY(item) + 18, z);
                sprite.userData.item = item;
                group.add(sprite);
            }

            this.styleGroups.set(style.id, group);
            this.group.add(group);
        }
    }

    _buildSkiMarkers() {
        const idleMat = this._makeSpriteMaterial(drawSkiMarker(false));
        for (const item of this.idleSkiAreas) {
            const { x, z } = this._localXZ(item);
            const sprite = new THREE.Sprite(idleMat);
            sprite.scale.set(34, 34, 1);
            sprite.position.set(x, this._elevationY(item) + 18, z);
            sprite.userData.item = item;
            this.skiGroup.add(sprite);
        }
    }

    // Idle markers don't sit inside the terrain's own shader, so their Y has
    // to be re-synced in JS whenever heightFactor moves (camera tilt). Cheap
    // enough on an interval — no need to do it every render frame.
    _syncIdleElevations() {
        const heightFactor = this.viewer.sharedMaterialUniforms?.heightFactor?.value ?? this.viewer.heightFactor ?? 0;
        if (heightFactor === this._lastSyncedHeightFactor) return;
        this._lastSyncedHeightFactor = heightFactor;
        let any = false;
        this.group.traverse(obj => {
            if (obj.isSprite && obj.userData.item && obj !== this.highlightSprite && obj !== this.highlightLabel) {
                obj.position.y = this._elevationY(obj.userData.item) + 18;
                any = true;
            }
        });
        this.skiGroup.traverse(obj => {
            if (obj.isSprite && obj.userData.item) {
                obj.position.y = this._elevationY(obj.userData.item) + 18;
                any = true;
            }
        });
        if (any) this.viewer.needsRender = true;
    }

    startElevationSync() {
        if (this._syncInterval) return;
        this._syncInterval = setInterval(() => { if (this.enabled) this._syncIdleElevations(); }, 150);
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        this.group.visible = enabled;
        this.skiGroup.visible = enabled;
        if (enabled && !this.loaded) this.load().then(() => {
            this.group.visible = this.enabled;
            this.skiGroup.visible = this.enabled;
            this.viewer.needsRender = true;
        });
        this.viewer.needsRender = true;
    }

    setStyle(styleId) {
        this.styleId = styleId;
        for (const [id, group] of this.styleGroups) group.visible = (id === styleId);
        this.viewer.needsRender = true;
        if (this.highlightItem) this.highlight(this.highlightItem);
    }

    // Vertical placement: reuse the viewer's live heightFactor so markers
    // rise with the terrain's flatten->relief animation, then float a fixed
    // offset above the peak's own elevation.
    _elevationY(item) {
        const sm = this.viewer.sharedMaterialUniforms;
        const floor = this.viewer.floorState?.value ?? 0;
        const heightFactor = sm?.heightFactor?.value ?? this.viewer.heightFactor ?? 0;
        return (item.ele - floor) * heightFactor;
    }

    clearHighlight() {
        if (this.highlightSprite) this.group.remove(this.highlightSprite);
        if (this.highlightLabel) this.group.remove(this.highlightLabel);
        this.highlightSprite = null;
        this.highlightLabel = null;
        this.highlightItem = null;
        this._animRunning = false;
    }

    highlight(item) {
        this.clearHighlight();
        if (!this.enabled || !item) return;

        const pos = (Number.isFinite(item.x) && Number.isFinite(item.y))
            ? { x: item.x, y: item.y }
            : latLonToWorld(item.lat, item.lon);
        const o = this.viewer.worldOrigin || { x: 0, y: 0 };
        const lx = pos.x - o.x, lz = -(pos.y - o.y);
        const ele = Number.isFinite(item.ele) ? item.ele : 0;
        const y = this._elevationY({ ele }) + 24;

        if (item.type === 'ski') {
            const mat = this._makeSpriteMaterial(drawSkiMarker(true));
            const sprite = new THREE.Sprite(mat);
            sprite.scale.set(90, 90, 1);
            sprite.position.set(lx, y, lz);
            this.group.add(sprite);
            this.highlightSprite = sprite;
        } else {
            const style = PEAK_MARKER_STYLES.find(s => s.id === this.styleId);
            const labelText = `${item.name} · ${Math.round(ele)}m`;
            if (style.isLabelStyle) {
                const sprite = this._makeLabelSprite(labelText, true, style.selectedWorldSize * 0.65);
                sprite.position.set(lx, y + 30, lz);
                this.group.add(sprite);
                this.highlightSprite = sprite;
            } else {
                const mat = this._makeSpriteMaterial(style.draw(true));
                const sprite = new THREE.Sprite(mat);
                sprite.scale.set(style.selectedWorldSize, style.selectedWorldSize, 1);
                sprite.position.set(lx, y, lz);
                this.group.add(sprite);
                this.highlightSprite = sprite;

                if (style.showLabelOnSelect) {
                    const label = this._makeLabelSprite(labelText, true, 45);
                    label.position.set(lx, y + style.selectedWorldSize * 0.9, lz);
                    this.group.add(label);
                    this.highlightLabel = label;
                }
            }
        }

        this.highlightItem = item;
        this._baseScale = this.highlightSprite.scale.clone();
        this._baseY = this.highlightSprite.position.y;
        this._animRunning = true;
        this._animStart = performance.now();
        if (!this._rafHandle) requestAnimationFrame(this._boundAnimate);
        this.viewer.needsRender = true;
    }

    _animateHighlight(t) {
        this._rafHandle = null;
        if (!this._animRunning || !this.highlightSprite) return;
        const style = this.highlightItem?.type === 'ski' ? null : PEAK_MARKER_STYLES.find(s => s.id === this.styleId);
        const elapsed = (t - this._animStart) / 1000;

        if (style?.animate === 'pulse') {
            const k = 1 + 0.12 * Math.sin(elapsed * 3.2);
            this.highlightSprite.scale.set(this._baseScale.x * k, this._baseScale.y * k, 1);
        } else if (style?.animate === 'bounce') {
            this.highlightSprite.position.y = this._baseY + Math.abs(Math.sin(elapsed * 2.6)) * 14;
        } else if (style?.animate === 'glow') {
            const k = 1 + 0.08 * Math.sin(elapsed * 4.0);
            this.highlightSprite.material.opacity = 0.85 + 0.15 * Math.sin(elapsed * 4.0);
            this.highlightSprite.scale.set(this._baseScale.x * k, this._baseScale.y * k, 1);
        }

        this.viewer.needsRender = true;
        this._rafHandle = requestAnimationFrame(this._boundAnimate);
    }
}
