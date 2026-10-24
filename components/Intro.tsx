"use client";

import { useEffect, useRef, useState } from "react";
import { LOGO_CELL, LOGO_COLS, LOGO_COUNT } from "@/lib/intro-logos";

const STORAGE_KEY = "atc-intro-seen";
const MIN_POINTS = 260;
const HOLD_MS = 1300;
const LEAVE_MS = 800;
const LOAD_TIMEOUT_MS = 3500;

type Sprite = {
  tx: number;
  ty: number;
  col: number;
  row: number;
  sx: number;
  sy: number;
  swirl: number;
  spin: number;
  grow: number;
  delay: number;
  dur: number;
};

function lineLayout(width: number): string[] {
  return width < 640 ? ["ANSON", "TOP", "CAR"] : ["ANSON", "TOP CAR"];
}

const MIN_SQUEEZE = 0.42;
const MAX_SQUEEZE = 1.25;
const FONT_FAMILY = '"Arial Black", "Helvetica Neue", Arial, sans-serif';

function fitFont(ctx: CanvasRenderingContext2D, lines: string[], width: number, height: number) {
  ctx.font = `900 100px ${FONT_FAMILY}`;
  const natural = lines.map((line) => ctx.measureText(line).width / 100);
  const lineHeight = 0.96;
  let size = (height * 0.8) / (lines.length * lineHeight);
  const fitSqueeze = (em: number) => (width * 0.92) / (em * size);
  const tightest = Math.min(...natural.map(fitSqueeze));
  if (tightest < MIN_SQUEEZE) size *= tightest / MIN_SQUEEZE;
  const squeezes = natural.map((em) => Math.min(MAX_SQUEEZE, Math.max(MIN_SQUEEZE, fitSqueeze(em))));
  return { size, lineHeight, squeezes };
}

type Layout = { points: [number, number][]; spacing: number; ghost: HTMLCanvasElement | null };

function sampleTargets(width: number, height: number): Layout {
  const mask = document.createElement("canvas");
  mask.width = width;
  mask.height = height;
  const ctx = mask.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { points: [], spacing: 24, ghost: null };

  const lines = lineLayout(width);
  const { size, lineHeight, squeezes } = fitFont(ctx, lines, width, height);
  ctx.clearRect(0, 0, width, height);
  ctx.font = `900 ${size}px ${FONT_FAMILY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = size * 0.1;
  ctx.fillStyle = "#000";
  ctx.strokeStyle = "#000";
  const blockH = lines.length * size * lineHeight;
  const top = (height - blockH) / 2 + (size * lineHeight) / 2;
  lines.forEach((line, i) => {
    ctx.save();
    ctx.translate(width / 2, top + i * size * lineHeight);
    ctx.scale(squeezes[i], 1);
    ctx.strokeText(line, 0, 0);
    ctx.fillText(line, 0, 0);
    ctx.restore();
  });
  const data = ctx.getImageData(0, 0, width, height).data;
  const solid = (x: number, y: number) => {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= width || iy >= height) return false;
    return data[(iy * width + ix) * 4 + 3] > 140;
  };

  let best: [number, number][] = [];
  let bestSpacing = 12;
  for (let spacing = 46; spacing >= 11; spacing -= 1) {
    const rowH = spacing * 0.866;
    const points: [number, number][] = [];
    for (let r = 0, y = rowH / 2; y < height; r++, y += rowH) {
      const shift = r % 2 ? spacing / 2 : 0;
      for (let x = spacing / 2 + shift; x < width; x += spacing) {
        if (solid(x, y)) points.push([x, y]);
      }
    }
    best = points;
    bestSpacing = spacing;
    if (points.length >= MIN_POINTS) break;
  }

  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = "#efefec";
  ctx.fillRect(0, 0, width, height);
  return { points: best, spacing: bestSpacing, ghost: mask };
}

function shuffle<T>(items: T[]): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildSprites(width: number, height: number) {
  const { points, spacing, ghost } = sampleTargets(width, height);
  const order = shuffle(points);
  const logoOrder = shuffle(Array.from({ length: LOGO_COUNT }, (_, i) => i));
  const radius = Math.hypot(width, height) * 0.62;
  const cx = width / 2;
  const cy = height / 2;
  const sprites: Sprite[] = order.map(([tx, ty], i) => {
    const logo = logoOrder[i % LOGO_COUNT];
    const angle = Math.random() * Math.PI * 2;
    const reach = radius * (0.85 + Math.random() * 0.35);
    return {
      tx,
      ty,
      col: logo % LOGO_COLS,
      row: Math.floor(logo / LOGO_COLS),
      sx: cx + Math.cos(angle) * reach,
      sy: cy + Math.sin(angle) * reach,
      swirl: (Math.random() < 0.5 ? -1 : 1) * (spacing * 3 + Math.random() * spacing * 6),
      spin: (Math.random() < 0.5 ? -1 : 1) * (Math.PI * (1.5 + Math.random() * 3)),
      grow: 1.8 + Math.random() * 1.6,
      delay: (i / Math.max(order.length, 1)) * 1100 + Math.random() * 200,
      dur: 1300 + Math.random() * 450,
    };
  });
  const flyEnd = sprites.reduce((max, s) => Math.max(max, s.delay + s.dur), 0);
  return { sprites, spacing, flyEnd, ghost };
}

export function Intro() {
  const [mounted, setMounted] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leaveRef = useRef<() => void>(() => {});

  useEffect(() => {
    const root = document.documentElement;
    const forced = new URLSearchParams(window.location.search).has("intro");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = !forced && (root.classList.contains("intro-seen") || sessionStorage.getItem(STORAGE_KEY));
    if (seen || reduce) {
      root.classList.remove("intro-lock");
      root.classList.add("intro-seen");
      setMounted(false);
      return;
    }

    root.classList.add("intro-lock");
    root.classList.remove("intro-seen");

    let raf = 0;
    let holdTimer = 0;
    let endTimer = 0;
    let loadTimer = 0;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      window.cancelAnimationFrame(raf);
      window.clearTimeout(holdTimer);
      window.clearTimeout(loadTimer);
      sessionStorage.setItem(STORAGE_KEY, "1");
      root.classList.remove("intro-lock");
      setLeaving(true);
      endTimer = window.setTimeout(() => {
        root.classList.add("intro-seen");
        setMounted(false);
      }, LEAVE_MS);
    };
    leaveRef.current = finish;

    const image = new Image();
    image.decoding = "async";
    loadTimer = window.setTimeout(finish, LOAD_TIMEOUT_MS);

    image.onerror = finish;
    image.onload = () => {
      window.clearTimeout(loadTimer);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || finished) {
        finish();
        return;
      }

      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const { sprites, spacing, flyEnd, ghost } = buildSprites(width, height);
      if (!sprites.length) {
        finish();
        return;
      }
      const drawSize = spacing * 1.14;
      const cell = LOGO_CELL;
      const start = performance.now();
      let holdArmed = false;

      const frame = (now: number) => {
        const t = now - start;
        ctx.clearRect(0, 0, width, height);
        const shineT = (t - flyEnd) / 900;
        if (ghost) {
          ctx.globalAlpha = Math.min(1, Math.max(0, (t - flyEnd + 900) / 1000));
          ctx.drawImage(ghost, 0, 0, width, height);
          ctx.globalAlpha = 1;
        }

        for (const s of sprites) {
          const u = Math.min(1, Math.max(0, (t - s.delay) / s.dur));
          if (u <= 0) continue;
          const e = 1 - Math.pow(1 - u, 3.4);
          const arc = Math.sin(Math.PI * e) * s.swirl * (1 - e * 0.35);
          const dx = s.tx - s.sx;
          const dy = s.ty - s.sy;
          const len = Math.hypot(dx, dy) || 1;
          const x = s.sx + dx * e + (-dy / len) * arc;
          const y = s.sy + dy * e + (dx / len) * arc;
          let scale = s.grow + (1 - s.grow) * e;
          if (shineT > 0 && shineT < 1.6) {
            const wave = shineT - s.tx / width;
            if (wave > 0 && wave < 0.5) scale *= 1 + 0.22 * Math.sin((wave / 0.5) * Math.PI);
          }
          const size = drawSize * scale;
          ctx.save();
          ctx.globalAlpha = Math.min(1, u * 5);
          ctx.translate(x, y);
          ctx.rotate(s.spin * (1 - e));
          ctx.drawImage(image, s.col * cell, s.row * cell, cell, cell, -size / 2, -size / 2, size, size);
          ctx.restore();
        }

        if (!holdArmed && t >= flyEnd) {
          holdArmed = true;
          holdTimer = window.setTimeout(finish, HOLD_MS);
        }
        if (!finished) raf = window.requestAnimationFrame(frame);
      };
      raf = window.requestAnimationFrame(frame);
    };
    image.src = "/intro/logos.webp";

    return () => {
      finished = true;
      window.cancelAnimationFrame(raf);
      window.clearTimeout(holdTimer);
      window.clearTimeout(endTimer);
      window.clearTimeout(loadTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`intro${leaving ? " out" : ""}`}
      role="img"
      aria-label="Anson Top Car"
      onClick={() => leaveRef.current()}
    >
      <canvas ref={canvasRef} className="intro-canvas" aria-hidden />
      <span className="vh">Anson Top Car</span>
      <span className="intro-skip">TAP TO SKIP</span>
    </div>
  );
}
