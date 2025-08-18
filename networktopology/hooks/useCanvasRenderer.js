// src/components/widgets/NetworkTopology/hooks/useCanvasRenderer.js
// Canvas rendering hook for the NetworkTopology feature.
//
// - DPR-correct sizing
// - Managed RAF loop with start/pause/redraw
// - ResizeObserver to track CSS size
// - Helpers for world/screen transforms
// - No JSX; pure JS + JSDoc types

import { useCallback, useEffect, useMemo, useRef } from "react";
import { renderNetwork as defaultRenderer } from "../Canvas/CanvasRenderer.js";
import { worldToScreen, screenToWorld } from "../lib/utils/canvasUtils.js";

/**
 * @typedef {Object} Viewport
 * @property {number} x
 * @property {number} y
 * @property {number} k
 *
 * @typedef {Object} DataSnapshot
 * @property {Array<Object>} nodes
 * @property {Array<Object>} edges
 * @property {Object} [meta]
 *
 * @typedef {Object} UseCanvasRendererOptions
 * @property {(ctx: CanvasRenderingContext2D, args: {data?: DataSnapshot, viewport?: Viewport}) => void} [renderer]
 * @property {boolean} [autoStart=true]
 * @property {(err: any) => void} [onError]
 * @property {number} [fallbackWidth=800]
 * @property {number} [fallbackHeight=600]
 */

/**
 * @param {UseCanvasRendererOptions} opts
 * @returns {{
 *   canvasRef: import('react').RefObject<HTMLCanvasElement>,
 *   start: () => void,
 *   pause: () => void,
 *   redraw: () => void,
 *   getCtx: () => CanvasRenderingContext2D | null,
 *   getSize: () => { width: number, height: number, dpr: number },
 *   toScreen: (vp: Viewport, x: number, y: number) => { x: number, y: number },
 *   toWorld: (vp: Viewport, sx: number, sy: number) => { x: number, y: number },
 *   setRenderer: (fn: UseCanvasRendererOptions['renderer']) => void,
 *   setData: (data?: DataSnapshot) => void,
 *   setViewport: (vp?: Viewport) => void,
 *   updateInputs: (data?: DataSnapshot, vp?: Viewport) => void,
 * }}
 */
export function useCanvasRenderer(opts = {}) {
  const {
    renderer = defaultRenderer,
    autoStart = true,
    onError,
    fallbackWidth = 800,
    fallbackHeight = 600,
  } = opts;

  const canvasRef = useRef(/** @type {HTMLCanvasElement|null} */ (null));
  const ctxRef = useRef(/** @type {CanvasRenderingContext2D|null} */ (null));
  const rendererRef = useRef(renderer);
  const rafRef = useRef(/** @type {number|undefined} */ (undefined));
  const runningRef = useRef(false);
  const roRef = useRef(/** @type {ResizeObserver|undefined} */ (undefined));
  const sizeRef = useRef({ width: fallbackWidth, height: fallbackHeight, dpr: 1 });

  // Latest inputs for draw()
  const latest = useRef({
    data: /** @type {DataSnapshot|undefined} */ (undefined),
    viewport: /** @type {Viewport|undefined} */ (undefined),
  });

  const setRenderer = useCallback((fn) => {
    if (typeof fn === "function") rendererRef.current = fn;
  }, []);

  const getCtx = useCallback(() => ctxRef.current, []);
  const getSize = useCallback(() => sizeRef.current, []);

  const dpr = useMemo(() => {
    if (typeof window === "undefined") return 1;
    return window.devicePixelRatio || 1;
  }, []);

  const ensureContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    if (!ctxRef.current) {
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctxRef.current = ctx;
    }
    return ctxRef.current;
  }, []);

  const resizeBackingStore = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, Math.floor(rect.width || fallbackWidth));
    const cssH = Math.max(1, Math.floor(rect.height || fallbackHeight));
    const nextDpr = dpr || 1;

    // Backing store size
    const pxW = Math.floor(cssW * nextDpr);
    const pxH = Math.floor(cssH * nextDpr);
    if (canvas.width !== pxW) canvas.width = pxW;
    if (canvas.height !== pxH) canvas.height = pxH;

    // CSS size
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const ctx = ensureContext();
    if (ctx) {
      // Reset to DPR transform (so 1 unit == 1 CSS px)
      ctx.setTransform(nextDpr, 0, 0, nextDpr, 0, 0);
    }

    sizeRef.current = { width: cssW, height: cssH, dpr: nextDpr };
  }, [dpr, ensureContext, fallbackWidth, fallbackHeight]);

  const draw = useCallback(() => {
    const ctx = ensureContext();
    if (!ctx) return;
    try {
      rendererRef.current?.(ctx, {
        data: latest.current.data,
        viewport: latest.current.viewport,
      });
    } catch (err) {
      if (onError) onError(err);
      else console.error("[useCanvasRenderer] draw error:", err);
    }
  }, [ensureContext, onError]);

  const loop = useCallback(() => {
    if (!runningRef.current) return;
    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  const start = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const pause = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = undefined;
  }, []);

  const redraw = useCallback(() => {
    draw();
  }, [draw]);

  // Mount / unmount
  useEffect(() => {
    resizeBackingStore();
    if (typeof ResizeObserver !== "undefined") {
      roRef.current = new ResizeObserver(() => {
        resizeBackingStore();
        if (!runningRef.current) draw();
      });
      const el = canvasRef.current;
      if (el) roRef.current.observe(el);
    }
    if (autoStart) start();

    return () => {
      pause();
      roRef.current?.disconnect();
      roRef.current = undefined;
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // Input updaters
  const updateInputs = useCallback((data, viewport) => {
    latest.current.data = data;
    latest.current.viewport = viewport;
  }, []);

  const setData = useCallback((data) => {
    latest.current.data = data;
    if (!runningRef.current) draw();
  }, [draw]);

  const setViewport = useCallback((viewport) => {
    latest.current.viewport = viewport;
    if (!runningRef.current) draw();
  }, [draw]);

  // Helpers passthrough
  const toScreen = useCallback((vp, x, y) => worldToScreen(vp, x, y), []);
  const toWorld = useCallback((vp, sx, sy) => screenToWorld(vp, sx, sy), []);

  return {
    canvasRef,
    start,
    pause,
    redraw,
    getCtx,
    getSize,
    toScreen,
    toWorld,
    setRenderer,
    setData,
    setViewport,
    updateInputs,
  };
}
