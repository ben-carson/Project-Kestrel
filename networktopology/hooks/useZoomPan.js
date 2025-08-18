// src/components/widgets/NetworkTopology/hooks/useZoomPan.js
import { useRef, useState, useCallback } from "react";
import { clamp } from "../lib/utils/canvasUtils.js";

export function useZoomPan(opts = {}) {
  const minK = opts.minK ?? 0.2;
  const maxK = opts.maxK ?? 8;
  const [viewport, setViewport] = useState({ x: 0, y: 0, k: 1 });

  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const zoomAt = useCallback((screenX, screenY, factor) => {
    setViewport(vp => {
      const nextK = clamp(vp.k * factor, minK, maxK);
      const wx = (screenX - vp.x) / vp.k;
      const wy = (screenY - vp.y) / vp.k;
      return { x: screenX - wx * nextK, y: screenY - wy * nextK, k: nextK };
    });
  }, [minK, maxK]);

  const focusWorld = useCallback((wx, wy, targetK) => {
    setViewport(vp => {
      const k = clamp(targetK ?? vp.k * 1.6, minK, maxK);
      // Center on current canvas; falls back to window if unknown
      const cx = (typeof window !== "undefined" ? window.innerWidth : 1200) / 2;
      const cy = (typeof window !== "undefined" ? window.innerHeight : 800) / 2;
      return { x: cx - wx * k, y: cy - wy * k, k };
    });
  }, [minK, maxK]);

  const onWheel = useCallback(e => {
    if (!e.currentTarget) return;
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    const factor = Math.pow(1.0015, -e.deltaY);
    zoomAt(e.clientX - r.left, e.clientY - r.top, factor);
  }, [zoomAt]);

  const onMouseDown = useCallback(e => { dragging.current = true; last.current = { x: e.clientX, y: e.clientY }; }, []);
  const onMouseMove = useCallback(e => {
    if (!dragging.current) return;
    setViewport(vp => {
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      return { ...vp, x: vp.x + dx, y: vp.y + dy };
    });
  }, []);
  const onMouseUp = useCallback(() => { dragging.current = false; }, []);
  const onMouseLeave = onMouseUp;

  const reset = useCallback(() => setViewport({ x: 0, y: 0, k: 1 }), []);
  const center = useCallback(() => setViewport(vp => ({ ...vp, x: 0, y: 0 })), []);
  const fit = useCallback((bounds, canvasSize, padding = 40) => {
    if (!bounds || !canvasSize) return;
    const w = Math.max(1, bounds.maxX - bounds.minX);
    const h = Math.max(1, bounds.maxY - bounds.minY);
    const scaleX = (canvasSize.width - padding * 2) / w;
    const scaleY = (canvasSize.height - padding * 2) / h;
    const k = clamp(Math.min(scaleX, scaleY), minK, maxK);
    const x = padding - bounds.minX * k + (canvasSize.width  - (w * k + padding * 2)) / 2;
    const y = padding - bounds.minY * k + (canvasSize.height - (h * k + padding * 2)) / 2;
    setViewport({ x, y, k });
  }, [minK, maxK]);

  return { viewport, onWheel, onMouseDown, onMouseMove, onMouseUp, onMouseLeave,
    zoomIn: () => zoomAt(window.innerWidth/2, window.innerHeight/2, 1.2),
    zoomOut: () => zoomAt(window.innerWidth/2, window.innerHeight/2, 1/1.2),
    reset, center, fit, focusWorld
  };
}
