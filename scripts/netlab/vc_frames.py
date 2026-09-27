#!/usr/bin/python3
"""Postprocess JPEG frames with system Python's NumPy and Pillow."""
import argparse
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw


def ssim(a, b):
    """Mean population SSIM of non-overlapping 8x8 luma blocks."""
    a = np.asarray(Image.open(a).convert('L'), dtype=np.float64)
    b = np.asarray(Image.open(b).convert('L'), dtype=np.float64)
    if a.shape != b.shape:
        raise ValueError(f'frame shapes differ: {a.shape} != {b.shape}')
    h, w = a.shape
    h -= h % 8; w -= w % 8
    a = a[:h, :w].reshape(h // 8, 8, w // 8, 8).transpose(0, 2, 1, 3)
    b = b[:h, :w].reshape(h // 8, 8, w // 8, 8).transpose(0, 2, 1, 3)
    ma = a.mean((2, 3)); mb = b.mean((2, 3))
    va = ((a - ma[..., None, None]) ** 2).mean((2, 3))
    vb = ((b - mb[..., None, None]) ** 2).mean((2, 3))
    cov = ((a - ma[..., None, None]) * (b - mb[..., None, None])).mean((2, 3))
    c1 = (0.01 * 255) ** 2; c2 = (0.03 * 255) ** 2
    return float(np.mean(((2 * ma * mb + c1) * (2 * cov + c2)) /
                         ((ma ** 2 + mb ** 2 + c1) * (va + vb + c2))))


def main():
    p = argparse.ArgumentParser()
    p.add_argument('manifest'); p.add_argument('out'); p.add_argument('--contact', required=True)
    a = p.parse_args()
    entries = json.loads(Path(a.manifest).read_text())
    by_phase = {}
    for e in entries['frames']:
        by_phase.setdefault(e['phase'], []).append(e)
    results = {}
    for phase, rows in by_phase.items():
        ref = entries['references'][phase]
        curve = [{'tMs': round(e['tMs'], 1), 'vc': round(ssim(e['file'], ref), 6)} for e in rows]
        integral = 0.0
        prev_t = 0.0; prev_y = 1.0
        for point in curve:
            y = max(0, 1 - point['vc'])
            integral += (point['tMs'] - prev_t) * (prev_y + y) / 2
            prev_t, prev_y = point['tMs'], y
        result = {'speedIndexMs': round(integral, 1), 'curve': curve}
        for threshold in (50, 85, 95):
            result[f'tVC{threshold}Ms'] = next((c['tMs'] for c in curve if c['vc'] >= threshold / 100), None)
        results[phase] = result
    assert ssim(entries['references'][next(iter(by_phase))], entries['references'][next(iter(by_phase))]) > .999999
    # One thumbnail per two seconds, with a compact time/phase label.
    thumbs = []
    for phase, rows in by_phase.items():
        last = -2000
        for e in rows:
            if e['tMs'] - last < 2000: continue
            last = e['tMs']
            im = Image.open(e['file']).convert('RGB'); im.thumbnail((180, 112))
            thumbs.append((phase, e['tMs'], im.copy()))
    cols = 6; cell_w = 184; cell_h = 136
    sheet = Image.new('RGB', (cols * cell_w, ((len(thumbs) + cols - 1) // cols) * cell_h), '#14161b')
    draw = ImageDraw.Draw(sheet)
    for n, (phase, ms, im) in enumerate(thumbs):
        x = (n % cols) * cell_w; y = (n // cols) * cell_h
        sheet.paste(im, (x, y))
        draw.text((x + 4, y + 114), f'{phase} {ms/1000:.1f}s', fill='white')
    sheet.save(a.contact)
    Path(a.out).write_text(json.dumps(results))

if __name__ == '__main__': main()
