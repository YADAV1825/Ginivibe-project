"use client";
/* eslint-disable react-hooks/immutability -- vendored upstream rAF loop: the
   self-scheduling render recursion and ref-buffer pixel mutation are the
   upstream design for this per-frame canvas renderer. */
/* eslint-disable react-hooks/set-state-in-effect -- vendored upstream mount
   effect synchronously kicks off its camera request; readiness state below
   only mirrors that external video element. */
import React, { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

type WebcamPixelGridProps = {
  /** Number of columns in the grid */
  gridCols?: number;
  /** Number of rows in the grid */
  gridRows?: number;
  /** Maximum elevation for motion detection */
  maxElevation?: number;
  /** Motion sensitivity (0-1) */
  motionSensitivity?: number;
  /** Smoothing factor for elevation transitions */
  elevationSmoothing?: number;
  /** Color mode: 'webcam' uses actual colors, 'monochrome' uses single color */
  colorMode?: "webcam" | "monochrome";
  /** Base color when in monochrome mode */
  monochromeColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Whether to mirror the webcam feed */
  mirror?: boolean;
  /** Gap between cells (0-1, fraction of cell size) */
  gapRatio?: number;
  /** Invert the colors */
  invertColors?: boolean;
  /** Darken factor (0-1, 0 = no darkening, 1 = fully dark) */
  darken?: number;
  /** Border color for cells */
  borderColor?: string;
  /** Border opacity (0-1) */
  borderOpacity?: number;
  /** Additional class name */
  className?: string;
  /** Callback when webcam access is denied */
  onWebcamError?: (error: Error) => void;
  /** Callback when webcam is ready */
  onWebcamReady?: () => void;
  /* ── GiniVibe extensions ──────────────────────────────── */
  /** External video source. `undefined` (default) opens the webcam itself;
   *  a MediaStream is sampled instead (never stopped by this component);
   *  `null` means no source — renders `fallback`. */
  stream?: MediaStream | null;
  /** What to render when no video frames are available.
   *  "none" (default) keeps upstream behavior; "brand" renders an animated
   *  GiniVibe lime→champagne pixel field and suppresses the error popup. */
  fallback?: "none" | "brand";
  /** Show the floating camera-error popup. Default true (upstream). */
  showErrorUI?: boolean;
};

type PixelData = {
  r: number;
  g: number;
  b: number;
  motion: number;
  targetElevation: number;
  currentElevation: number;
};

/* GiniVibe brand field: lime spark melting into champagne, sampled per cell
 * with a slow traveling shimmer so the motion pipeline lifts the 3D cells. */
const BRAND_STOPS: Array<[number, number, number]> = [
  [182, 255, 46], // #B6FF2E lime spark
  [217, 248, 115], // #D9F873
  [248, 231, 201], // #F8E7C9 champagne
];

function synthesizeBrandFrame(
  cols: number,
  rows: number,
  timeSec: number,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(cols * rows * 4);
  for (let row = 0; row < rows; row++) {
    const v = rows <= 1 ? 0 : row / (rows - 1);
    for (let col = 0; col < cols; col++) {
      const u = cols <= 1 ? 0 : col / (cols - 1);
      // Diagonal position across the brand gradient (matches --gv-canvas).
      const d = Math.min(1, Math.max(0, (u * 0.72 + v * 0.55) / 1.27));
      const seg = Math.min(0.9999, d * (BRAND_STOPS.length - 1));
      const i0 = Math.floor(seg);
      const f = seg - i0;
      const c0 = BRAND_STOPS[i0];
      const c1 = BRAND_STOPS[i0 + 1];
      // Traveling shimmer wave; frame diffs become motion → elevation.
      const wave = 0.5 + 0.5 * Math.sin(u * 6.0 + v * 4.2 - timeSec * 1.6);
      const pulse = 0.84 + 0.16 * wave;
      const idx = (row * cols + col) * 4;
      data[idx] = Math.round((c0[0] + (c1[0] - c0[0]) * f) * pulse);
      data[idx + 1] = Math.round((c0[1] + (c1[1] - c0[1]) * f) * pulse);
      data[idx + 2] = Math.round((c0[2] + (c1[2] - c0[2]) * f) * pulse);
      data[idx + 3] = 255;
    }
  }
  return data;
}

export const WebcamPixelGrid: React.FC<WebcamPixelGridProps> = ({
  gridCols = 64,
  gridRows = 48,
  maxElevation = 15,
  motionSensitivity = 0.4,
  elevationSmoothing = 0.1,
  colorMode = "webcam",
  monochromeColor = "#00ff88",
  backgroundColor = "#0a0a0a",
  mirror = true,
  gapRatio = 0.1,
  invertColors = false,
  darken = 0,
  borderColor = "#ffffff",
  borderOpacity = 0.08,
  className,
  onWebcamError,
  onWebcamReady,
  stream,
  fallback = "none",
  showErrorUI = true,
}) => {
  // GiniVibe: external-source mode when the `stream` prop is provided.
  const externalMode = stream !== undefined;
  const videoRef = useRef<HTMLVideoElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const previousFrameRef = useRef<Uint8ClampedArray | null>(null);
  const pixelDataRef = useRef<PixelData[][]>([]);
  const animationRef = useRef<number>(0);
  // GiniVibe: with a brand fallback the canvas is meaningful from the first
  // frame (pixels show instantly; the feed takes over once granted).
  const [isReady, setIsReady] = useState(fallback === "brand");
  const [error, setError] = useState<string | null>(null);
  const [showErrorPopup, setShowErrorPopup] = useState(true);

  // Parse monochrome color
  const monoRGB = React.useMemo(() => {
    const hex = monochromeColor.replace("#", "");
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }, [monochromeColor]);

  // Parse border color
  const borderRGB = React.useMemo(() => {
    const hex = borderColor.replace("#", "");
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }, [borderColor]);

  // Initialize pixel data
  useEffect(() => {
    pixelDataRef.current = Array.from({ length: gridRows }, () =>
      Array.from({ length: gridCols }, () => ({
        r: 30,
        g: 30,
        b: 30,
        motion: 0,
        targetElevation: 0,
        currentElevation: 0,
      })),
    );
  }, [gridCols, gridRows]);

  const streamRef = useRef<MediaStream | null>(null);

  // Request camera access
  const requestCameraAccess = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsReady(true);
        setError(null);
        setShowErrorPopup(false);
        onWebcamReady?.();
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Webcam access denied");
      setError(error.message);
      onWebcamError?.(error);
    }
  }, [onWebcamError, onWebcamReady]);

  // Initialize webcam on mount (upstream behavior; skipped in external mode)
  useEffect(() => {
    if (externalMode) return;

    requestCameraAccess();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [requestCameraAccess, externalMode]);

  // GiniVibe: attach an externally owned stream (e.g. a WebRTC track).
  // External tracks are never stopped here — the owner manages them.
  useEffect(() => {
    if (!externalMode) return;
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
      video
        .play()
        .then(() => {
          setIsReady(true);
          setError(null);
          setShowErrorPopup(false);
          onWebcamReady?.();
        })
        .catch((err: unknown) => {
          const error =
            err instanceof Error ? err : new Error("Could not play stream");
          if (fallback === "none") {
            setError(error.message);
            onWebcamError?.(error);
          }
        });
    } else {
      // Null source is an expected state, not an error: with a brand
      // fallback the canvas keeps showing pixels (ready from mount); without
      // one `canvasVisible` below hides it — no state write needed.
      video.srcObject = null;
    }

    return () => {
      video.srcObject = null;
    };
  }, [externalMode, stream, fallback, onWebcamError, onWebcamReady]);

  // GiniVibe: the canvas (and its rAF loop) is live only when there is
  // something to show — a ready feed, or brand pixels covering a null source.
  const canvasVisible =
    isReady && (!externalMode || !!stream || fallback === "brand");

  // Main render loop
  const render = useCallback(() => {
    const video = videoRef.current;
    const processingCanvas = processingCanvasRef.current;
    const displayCanvas = displayCanvasRef.current;

    // GiniVibe: a live feed needs an attached source with real frames
    // (audio-only streams and denied cameras fall through to the fallback).
    const videoLive =
      !!video &&
      !!video.srcObject &&
      video.readyState >= 2 &&
      video.videoWidth > 0;
    const useFallback = !videoLive && fallback === "brand";

    if (!displayCanvas || (!videoLive && !useFallback)) {
      animationRef.current = requestAnimationFrame(render);
      return;
    }

    if (!video || !processingCanvas) {
      animationRef.current = requestAnimationFrame(render);
      return;
    }

    const procCtx = processingCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    const dispCtx = displayCanvas.getContext("2d");

    if (!procCtx || !dispCtx) {
      animationRef.current = requestAnimationFrame(render);
      return;
    }

    let currentData: Uint8ClampedArray;
    if (videoLive) {
      // Set processing canvas size to grid dimensions
      processingCanvas.width = gridCols;
      processingCanvas.height = gridRows;

      // Draw video to processing canvas (scaled down)
      procCtx.save();
      if (mirror) {
        procCtx.scale(-1, 1);
        procCtx.drawImage(video, -gridCols, 0, gridCols, gridRows);
      } else {
        procCtx.drawImage(video, 0, 0, gridCols, gridRows);
      }
      procCtx.restore();

      // Get pixel data
      const imageData = procCtx.getImageData(0, 0, gridCols, gridRows);
      currentData = imageData.data;
    } else {
      // GiniVibe brand field. Freeze the shimmer for reduced-motion users
      // so the decorative background stays perfectly still for them.
      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const t = reduceMotion ? 0 : performance.now() / 1000;
      currentData = synthesizeBrandFrame(gridCols, gridRows, t);
    }
    const previousData = previousFrameRef.current;

    // Update pixel data with motion detection
    const pixels = pixelDataRef.current;
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const idx = (row * gridCols + col) * 4;
        const r = currentData[idx];
        const g = currentData[idx + 1];
        const b = currentData[idx + 2];

        const pixel = pixels[row]?.[col];
        if (!pixel) continue;

        // Calculate motion
        let motion = 0;
        if (previousData) {
          const prevR = previousData[idx];
          const prevG = previousData[idx + 1];
          const prevB = previousData[idx + 2];
          const diff =
            Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB);
          motion = Math.min(1, diff / 255 / motionSensitivity);
        }

        // Smooth motion
        pixel.motion = pixel.motion * 0.7 + motion * 0.3;

        // Set colors
        let finalR = r;
        let finalG = g;
        let finalB = b;

        if (colorMode === "monochrome") {
          const brightness = (r + g + b) / 3 / 255;
          finalR = Math.round(monoRGB.r * brightness);
          finalG = Math.round(monoRGB.g * brightness);
          finalB = Math.round(monoRGB.b * brightness);
        }

        // Apply invert
        if (invertColors) {
          finalR = 255 - finalR;
          finalG = 255 - finalG;
          finalB = 255 - finalB;
        }

        // Apply darken
        if (darken > 0) {
          const darkenFactor = 1 - darken;
          finalR = Math.round(finalR * darkenFactor);
          finalG = Math.round(finalG * darkenFactor);
          finalB = Math.round(finalB * darkenFactor);
        }

        pixel.r = finalR;
        pixel.g = finalG;
        pixel.b = finalB;

        // Set target elevation
        pixel.targetElevation = pixel.motion * maxElevation;

        // Smooth elevation transition
        pixel.currentElevation +=
          (pixel.targetElevation - pixel.currentElevation) * elevationSmoothing;
      }
    }

    // Store current frame for next comparison
    previousFrameRef.current = new Uint8ClampedArray(currentData);

    // Render to display canvas
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = displayCanvas.clientWidth;
    const displayHeight = displayCanvas.clientHeight;

    displayCanvas.width = displayWidth * dpr;
    displayCanvas.height = displayHeight * dpr;
    dispCtx.scale(dpr, dpr);

    // Clear canvas
    dispCtx.fillStyle = backgroundColor;
    dispCtx.fillRect(0, 0, displayWidth, displayHeight);

    // Calculate cell size (always square, cover entire container like object-fit: cover)
    const cellSize = Math.max(
      displayWidth / gridCols,
      displayHeight / gridRows,
    );
    const gap = cellSize * gapRatio;

    // Calculate offset to center the grid (negative offset for overflow, creating cover effect)
    const gridWidth = cellSize * gridCols;
    const gridHeight = cellSize * gridRows;
    const offsetXGrid = (displayWidth - gridWidth) / 2;
    const offsetYGrid = (displayHeight - gridHeight) / 2;

    // Draw cells with 3D effect
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const pixel = pixels[row]?.[col];
        if (!pixel) continue;

        const x = offsetXGrid + col * cellSize;
        const y = offsetYGrid + row * cellSize;
        const elevation = pixel.currentElevation;

        // Calculate 3D offset (isometric-like projection) - MUCH larger effect
        const offsetX = -elevation * 1.2;
        const offsetY = -elevation * 1.8;

        // Draw shadow - larger and more visible
        if (elevation > 0.5) {
          dispCtx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.6, elevation * 0.04)})`;
          dispCtx.fillRect(
            x + gap / 2 + elevation * 1.5,
            y + gap / 2 + elevation * 2.0,
            cellSize - gap,
            cellSize - gap,
          );
        }

        // Draw side faces for 3D effect - thicker sides
        if (elevation > 0.5) {
          // Right side
          dispCtx.fillStyle = `rgb(${Math.max(0, pixel.r - 80)}, ${Math.max(0, pixel.g - 80)}, ${Math.max(0, pixel.b - 80)})`;
          dispCtx.beginPath();
          dispCtx.moveTo(
            x + cellSize - gap / 2 + offsetX,
            y + gap / 2 + offsetY,
          );
          dispCtx.lineTo(x + cellSize - gap / 2, y + gap / 2);
          dispCtx.lineTo(x + cellSize - gap / 2, y + cellSize - gap / 2);
          dispCtx.lineTo(
            x + cellSize - gap / 2 + offsetX,
            y + cellSize - gap / 2 + offsetY,
          );
          dispCtx.closePath();
          dispCtx.fill();

          // Bottom side
          dispCtx.fillStyle = `rgb(${Math.max(0, pixel.r - 50)}, ${Math.max(0, pixel.g - 50)}, ${Math.max(0, pixel.b - 50)})`;
          dispCtx.beginPath();
          dispCtx.moveTo(
            x + gap / 2 + offsetX,
            y + cellSize - gap / 2 + offsetY,
          );
          dispCtx.lineTo(x + gap / 2, y + cellSize - gap / 2);
          dispCtx.lineTo(x + cellSize - gap / 2, y + cellSize - gap / 2);
          dispCtx.lineTo(
            x + cellSize - gap / 2 + offsetX,
            y + cellSize - gap / 2 + offsetY,
          );
          dispCtx.closePath();
          dispCtx.fill();
        }

        // Draw top face (main cell) - brighter when elevated
        const brightness = 1 + elevation * 0.05;
        dispCtx.fillStyle = `rgb(${Math.min(255, Math.round(pixel.r * brightness))}, ${Math.min(255, Math.round(pixel.g * brightness))}, ${Math.min(255, Math.round(pixel.b * brightness))})`;
        dispCtx.fillRect(
          x + gap / 2 + offsetX,
          y + gap / 2 + offsetY,
          cellSize - gap,
          cellSize - gap,
        );

        // Draw light border around top face
        dispCtx.strokeStyle = `rgba(${borderRGB.r}, ${borderRGB.g}, ${borderRGB.b}, ${borderOpacity + elevation * 0.008})`;
        dispCtx.lineWidth = 0.5;
        dispCtx.strokeRect(
          x + gap / 2 + offsetX,
          y + gap / 2 + offsetY,
          cellSize - gap,
          cellSize - gap,
        );
      }
    }

    animationRef.current = requestAnimationFrame(render);
  }, [
    gridCols,
    gridRows,
    mirror,
    motionSensitivity,
    colorMode,
    monoRGB,
    maxElevation,
    elevationSmoothing,
    backgroundColor,
    gapRatio,
    invertColors,
    darken,
    borderRGB,
    borderOpacity,
    fallback,
  ]);

  // Start render loop when ready
  useEffect(() => {
    if (!canvasVisible) return;

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [canvasVisible, render]);

  return (
    <div className={cn("relative h-full w-full", className)}>
      {/* Hidden video element */}
      <video
        ref={videoRef}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        playsInline
        muted
      />

      {/* Hidden processing canvas */}
      <canvas
        ref={processingCanvasRef}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />

      {/* Display canvas with fade-in */}
      <canvas
        ref={displayCanvasRef}
        className={cn(
          "h-full w-full transition-opacity duration-1000",
          canvasVisible ? "opacity-100" : "opacity-0",
        )}
        style={{ backgroundColor }}
      />

      {/* Error popup (GiniVibe: hidden when showErrorUI is false or a brand
          fallback is already covering the denied-camera state) */}
      {error && showErrorPopup && showErrorUI && fallback === "none" && (
        <div className="animate-in fade-in slide-in-from-top-2 fixed top-4 right-4 z-50 duration-300">
          <div className="relative flex max-w-sm items-start gap-3 rounded-lg border border-white/10 bg-black/80 p-4 shadow-2xl backdrop-blur-xl">
            {/* Close button */}
            <button
              onClick={() => setShowErrorPopup(false)}
              className="absolute top-2 right-2 rounded-md p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Camera icon */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
              <svg
                className="h-5 w-5 text-white/60"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>

            {/* Content */}
            <div className="flex-1 pr-4">
              <p className="text-sm font-medium text-white/90">
                Camera access needed
              </p>
              <p className="mt-1 text-xs text-white/50">
                Enable camera for the interactive background effect
              </p>
              <button
                onClick={requestCameraAccess}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Enable Camera
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimized error indicator (same GiniVibe suppression rule) */}
      {error && !showErrorPopup && showErrorUI && fallback === "none" && (
        <button
          onClick={() => setShowErrorPopup(true)}
          className="fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/50 shadow-lg backdrop-blur-xl transition-all hover:scale-105 hover:bg-black/80 hover:text-white/80"
          title="Camera access required"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3l18 18"
              className="text-red-400"
              stroke="currentColor"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default WebcamPixelGrid;
