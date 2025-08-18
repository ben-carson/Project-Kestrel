// src/components/widgets/NetworkTopology/lib/utils/canvasUtils.js
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function worldToScreen(vp, x, y) {
  const k = vp?.k ?? 1, vx = vp?.x ?? 0, vy = vp?.y ?? 0;
  return { x: x * k + vx, y: y * k + vy };
}

export function screenToWorld(vp, sx, sy) {
  const k = vp?.k ?? 1, vx = vp?.x ?? 0, vy = vp?.y ?? 0;
  return { x: (sx - vx) / k, y: (sy - vy) / k };
}
