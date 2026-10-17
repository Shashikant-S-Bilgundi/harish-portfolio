/* =========================================================
   HARISH MOGER — PORTFOLIO · portfolio.ts  (typed port of script.js)
   GSAP 3.13 (ScrollTrigger, SplitText, Draggable, InertiaPlugin) + Lenis
   Call initPortfolio() once the React markup is mounted.
   ========================================================= */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { SITE_DATA, CONFIG, PROJECTS, type ResolvedProject, type Reel, type Post } from '../data/siteData';

gsap.registerPlugin(ScrollTrigger, SplitText, Draggable, InertiaPlugin);

/* =======================================================
   1. TYPES
   ======================================================= */
type Painter = (ctx: CanvasRenderingContext2D, w: number, h: number, p: number) => void;
type Scrambling = HTMLElement & { _scr?: number };
type DragEx = Draggable & { _lx?: number };
type Cleanup = (() => void) | null | undefined;
type FieldKey = 'name' | 'email' | 'message';
type FieldEl = HTMLInputElement | HTMLTextAreaElement;
type ReelItem = { type: 'reel' } & Reel;
type PostItem = { type: 'post'; n: number; resolved: string } & Post;
type MediaItem = ReelItem | PostItem;

interface Loop {
  track: HTMLElement;
  speed: number;
  dir: number;
  skew: boolean;
  x: number;
  half: number;
  sk: number;
  paused: boolean;
  visible: boolean;
  measure: () => void;
}

/* =======================================================
   2. HELPERS AND ENVIRONMENT
   ======================================================= */
const root = document.documentElement;
const $ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document): T => c.querySelector<T>(s) as T;
const $$ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document): T[] => Array.from(c.querySelectorAll<T>(s));
const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const debounce = <A extends unknown[]>(fn: (...a: A) => void, ms = 150) => {
  let t: number | undefined;
  return (...a: A): void => { window.clearTimeout(t); t = window.setTimeout(() => fn(...a), ms); };
};
const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s: unknown): string => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
const mq = (q: string): boolean => window.matchMedia(q).matches;
const isMobile = (): boolean => window.innerWidth < 768;

const REDUCED = mq('(prefers-reduced-motion: reduce)');
const FINE_POINTER = mq('(hover: hover) and (pointer: fine)');
const CONN = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection || {};
const SAVE_DATA = !!(CONN.saveData || /2g$/.test(CONN.effectiveType || ''));
const MOBILE_AT_LOAD = isMobile();

let MEDIA: MediaItem[] = [];
let lenis: Lenis | null = null;
let heroST: ScrollTrigger | null = null;
let menuOpen = false;
let setMenu: (open: boolean) => void = () => {};
let ADDRESS_DEFAULT = 'harishmoger.design/work';
let disposers: Array<() => void> = [];

const heroScale = (): number => (isMobile() ? CONFIG.heroScreen.mobileScale : CONFIG.heroScreen.scale);
const setNavVisible = (v: boolean): void => { const nav = $('#nav'); if (nav) nav.classList.toggle('is-visible', v); };

/** addEventListener that is automatically removed by the cleanup returned from initPortfolio(). */
function on<K extends keyof WindowEventMap>(t: Window, type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions): void;
function on<K extends keyof DocumentEventMap>(t: Document, type: K, fn: (e: DocumentEventMap[K]) => void, opts?: AddEventListenerOptions): void;
function on(t: Window | Document, type: string, fn: (e: never) => void, opts?: AddEventListenerOptions): void {
  t.addEventListener(type, fn as EventListener, opts);
  disposers.push(() => t.removeEventListener(type, fn as EventListener, opts));
}

function tickerAdd(fn: gsap.TickerCallback): void {
  gsap.ticker.add(fn);
  disposers.push(() => gsap.ticker.remove(fn));
}

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/_';
const LOWER = 'abcdefghijklmnopqrstuvwxyz0123456789./-';

function scramble(el: Scrambling | null, text?: string | null, { duration = 600, chars = UPPER }: { duration?: number; chars?: string } = {}): void {
  if (!el) return;
  const final: string = text != null ? text : (el.textContent ?? '');
  const token = (el._scr = (el._scr || 0) + 1);
  if (REDUCED) { el.textContent = final; return; }
  const start = performance.now();
  const step = (now: number): void => {
    if (token !== el._scr) return;
    const t = clamp((now - start) / duration, 0, 1);
    const shown = Math.floor(t * final.length);
    let out = '';
    for (let i = 0; i < final.length; i++) {
      const c = final[i];
      out += i < shown || c === ' ' ? c : chars[(Math.random() * chars.length) | 0];
    }
    el.textContent = out;
    if (t < 1) requestAnimationFrame(step); else el.textContent = final;
  };
  requestAnimationFrame(step);
}

function typeText(el: HTMLElement | null, text: string, speed = 45): void {
  if (!el) return;
  el.textContent = '';
  if (REDUCED) { el.textContent = text; return; }
  let i = 0;
  const id = window.setInterval(() => {
    el.textContent = text.slice(0, ++i);
    if (i >= text.length) window.clearInterval(id);
  }, speed);
}

function trapFocus(container: HTMLElement, e: KeyboardEvent): void {
  const els = $$('a[href], button:not([disabled]), input, textarea, iframe, [tabindex]:not([tabindex="-1"])', container)
    .filter((el) => !el.hidden && el.offsetParent !== null);
  if (!els.length) return;
  const first = els[0], last = els[els.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function scrollToTarget(target: HTMLElement | 0, duration = 1.6): void {
  if (lenis) { lenis.scrollTo(target, { offset: target === 0 ? 0 : -80, duration }); return; }
  const behavior: ScrollBehavior = REDUCED ? 'auto' : 'smooth';
  const top = target === 0 ? 0 : target.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top, behavior });
}

/* =======================================================
   3. CANVAS PAINTERS (placeholder scenes until real frames exist)
   ======================================================= */
const TAU = Math.PI * 2;
const seg = (p: number, a: number, b: number): number => clamp((p - a) / (b - a), 0, 1);
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  w = Math.max(0, w); h = Math.max(0, h); r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') { ctx.roundRect(x, y, w, h, r); return; }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function paintBase(ctx: CanvasRenderingContext2D, w: number, h: number, glow: number): void {
  ctx.fillStyle = '#07060B';
  ctx.fillRect(0, 0, w, h);
  const m = Math.max(w, h);
  let g = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, m * 0.62);
  g.addColorStop(0, `rgba(91,33,182,${0.55 * glow})`);
  g.addColorStop(0.45, `rgba(46,16,101,${0.28 * glow})`);
  g.addColorStop(1, 'rgba(7,6,11,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  g = ctx.createRadialGradient(w * 0.82, h * 0.85, 0, w * 0.82, h * 0.85, m * 0.3);
  g.addColorStop(0, 'rgba(255,138,76,0.13)');
  g.addColorStop(1, 'rgba(255,138,76,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

function paintEndPlate(ctx: CanvasRenderingContext2D, w: number, h: number, a: number): void {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; paintBase(ctx, w, h, 1); ctx.restore();
}

function paintScreen(ctx: CanvasRenderingContext2D, cx: number, cy: number, sw: number, sh: number, u: number, glow: number): void {
  const bez = 10 * u;
  rr(ctx, cx - sw / 2 - bez, cy - sh / 2 - bez, sw + bez * 2, sh + bez * 2, 16 * u);
  ctx.fillStyle = '#100D18'; ctx.fill();
  ctx.lineWidth = Math.max(1, u); ctx.strokeStyle = 'rgba(196,181,253,0.35)'; ctx.stroke();
  rr(ctx, cx - sw / 2, cy - sh / 2, sw, sh, 8 * u);
  ctx.fillStyle = '#0B0912'; ctx.fill();
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(sw, sh) * 0.75);
  g.addColorStop(0, `rgba(139,92,246,${0.5 * glow})`);
  g.addColorStop(1, `rgba(46,16,101,${0.3 * glow})`);
  ctx.fillStyle = g; ctx.fill();
}

function paintDeck(ctx: CanvasRenderingContext2D, cx: number, y: number, sw: number, u: number): void {
  const bez = 10 * u;
  ctx.beginPath();
  ctx.moveTo(cx - sw / 2 - bez - 8 * u, y);
  ctx.lineTo(cx + sw / 2 + bez + 8 * u, y);
  ctx.lineTo(cx + sw / 2 + bez + 44 * u, y + 16 * u);
  ctx.lineTo(cx - sw / 2 - bez - 44 * u, y + 16 * u);
  ctx.closePath();
  ctx.fillStyle = '#1B1726'; ctx.fill();
  ctx.lineWidth = Math.max(1, u); ctx.strokeStyle = 'rgba(196,181,253,0.22)'; ctx.stroke();
}

const paintAssembly: Painter = (ctx, w, h, p) => {
  const S = MOBILE_AT_LOAD ? CONFIG.heroScreen.mobileScale : CONFIG.heroScreen.scale;
  const u = Math.min(w, h * 1.6) / 1600;
  paintBase(ctx, w, h, 0.45 + 0.45 * seg(p, 0.1, 0.7));
  const slide = easeOut(seg(p, 0.08, 0.3));
  const push = easeInOut(seg(p, 0.7, 0.95));
  const z = 1 + push * (1 / S - 1) * 1.06;
  const sw = w * S * z, sh = h * S * z;
  const cx = w * CONFIG.heroScreen.x + (1 - slide) * w * 0.8;
  const cy = h * CONFIG.heroScreen.y;
  if (slide > 0) {
    paintScreen(ctx, cx, cy, sw, sh, u * z, 0.55 + 0.45 * seg(p, 0.3, 0.7));
    paintDeck(ctx, cx, cy + sh / 2 + 10 * u * z, sw, u * z);
  }
  paintEndPlate(ctx, w, h, seg(p, 0.9, 1));
};

const paintBuilder: Painter = (ctx, w, h, p) => {
  const u = Math.min(w, h * 1.6) / 1600;
  paintBase(ctx, w, h, 0.5 + 0.3 * seg(p, 0, 0.6));
  const orbit = easeInOut(seg(p, 0.02, 0.7));
  const push = easeInOut(seg(p, 0.78, 0.97));
  const cx = w * 0.5, cy = h * 0.5;

  const pool = ctx.createRadialGradient(cx, cy + h * 0.22, 0, cx, cy + h * 0.22, w * 0.35);
  pool.addColorStop(0, 'rgba(196,181,253,0.10)');
  pool.addColorStop(1, 'rgba(196,181,253,0)');
  ctx.fillStyle = pool; ctx.fillRect(0, 0, w, h);

  Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * TAU + orbit * Math.PI * 0.95;
    return { i, a, depth: (Math.sin(a) + 1) / 2 };
  }).sort((A, B) => A.depth - B.depth).forEach(({ i, a, depth }) => {
    const s = (0.55 + depth * 0.65) * u * (1 + push * 2.5);
    const x = cx + Math.cos(a) * w * 0.33 * (1 + push);
    const y = cy - h * 0.05 + Math.sin(a) * h * 0.11 + Math.sin(i * 1.7) * h * 0.09;
    const pw = (130 + (i % 3) * 46) * s, ph = (84 + (i % 2) * 40) * s;
    ctx.globalAlpha = (0.25 + depth * 0.65) * (1 - push);
    rr(ctx, x - pw / 2, y - ph / 2, pw, ph, 12 * s);
    ctx.fillStyle = 'rgba(124,58,237,0.16)'; ctx.fill();
    ctx.lineWidth = Math.max(1, u); ctx.strokeStyle = 'rgba(196,181,253,0.6)'; ctx.stroke();
    ctx.fillStyle = 'rgba(237,233,254,0.55)';
    rr(ctx, x - pw / 2 + 12 * s, y - ph / 2 + 14 * s, pw * 0.5, 7 * s, 3 * s); ctx.fill();
    ctx.fillStyle = 'rgba(237,233,254,0.25)';
    rr(ctx, x - pw / 2 + 12 * s, y - ph / 2 + 30 * s, pw * 0.32, 6 * s, 3 * s); ctx.fill();
  });
  ctx.globalAlpha = 1;

  const reveal = seg(p, 0.5, 0.75);
  if (reveal > 0) {
    const z = 1 + push * 3.4;
    const mw = Math.min(w * 0.34, h * 0.9) * z, mh = mw * 0.6;
    const my = cy + h * 0.02 * (1 - push);
    ctx.globalAlpha = reveal;
    paintScreen(ctx, cx, my, mw, mh, u * z, 0.8);
    const cols = 3, rows = 2, gap = 10 * u * z;
    const tw = (mw - gap * (cols + 1)) / cols, th = (mh - gap * (rows + 1)) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const proj = PROJECTS[(r * cols + c) % PROJECTS.length];
        const tx = cx - mw / 2 + gap + c * (tw + gap), ty = my - mh / 2 + gap + r * (th + gap);
        rr(ctx, tx, ty, tw, th, 6 * u * z);
        const g = ctx.createLinearGradient(tx, ty, tx + tw, ty + th);
        g.addColorStop(0, proj.color); g.addColorStop(1, '#0B0912');
        ctx.fillStyle = g; ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  paintEndPlate(ctx, w, h, seg(p, 0.9, 1));
};

const paintInvitation: Painter = (ctx, w, h, p) => {
  const u = Math.min(w, h * 1.6) / 1600;
  const open = easeInOut(seg(p, 0.3, 0.6));
  const push = easeInOut(seg(p, 0.62, 0.95));
  paintBase(ctx, w, h, 0.45 + 0.45 * open);
  const z = 1 + push * 3.6;
  const base = Math.min(w * (w < h ? 0.7 : 0.36), h * 0.8);
  const lw = base * z, lh = lw * 0.62;
  const lidH = lh * (0.06 + 0.94 * open);
  const cx = w * 0.5;
  const hinge0 = h * 0.4 + (base * 0.62) / 2;
  const hinge = hinge0 + (h * 0.5 + lidH / 2 - hinge0) * push;

  if (open > 0) {
    const b = ctx.createRadialGradient(cx, hinge - lidH / 2, 0, cx, hinge - lidH / 2, lw * 1.1);
    b.addColorStop(0, `rgba(196,181,253,${0.28 * open})`);
    b.addColorStop(1, 'rgba(196,181,253,0)');
    ctx.fillStyle = b; ctx.fillRect(0, 0, w, h);
  }
  rr(ctx, cx - lw / 2, hinge - lidH, lw, lidH, 14 * u * z);
  ctx.fillStyle = '#100D18'; ctx.fill();
  ctx.lineWidth = Math.max(1, u); ctx.strokeStyle = 'rgba(196,181,253,0.4)'; ctx.stroke();
  const inset = 10 * u * z;
  if (open > 0.05 && lidH > inset * 3) {
    rr(ctx, cx - lw / 2 + inset, hinge - lidH + inset, lw - inset * 2, lidH - inset * 2, 6 * u * z);
    const g = ctx.createRadialGradient(cx, hinge - lidH / 2, 0, cx, hinge - lidH / 2, lw * 0.7);
    g.addColorStop(0, `rgba(167,139,250,${0.75 * open})`);
    g.addColorStop(1, `rgba(46,16,101,${0.5 * open})`);
    ctx.fillStyle = g; ctx.fill();
  }
  paintDeck(ctx, cx, hinge, lw - 20 * u * z, u * z);
  paintEndPlate(ctx, w, h, seg(p, 0.9, 1));
};

const PAINTERS: Painter[] = [paintAssembly, paintBuilder, paintInvitation];

/* =======================================================
   4. FRAME SEQUENCE (scroll-scrubbed image sequence)
   ======================================================= */
interface FrameSequenceOptions { dir: string; count: number; painter: Painter }

class FrameSequence {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dir: string;
  count: number;
  painter: Painter;
  frames: Array<HTMLImageElement | undefined>;
  requested = new Set<number>();
  p = 0;
  current = -1;
  mode: 'unknown' | 'frames' | 'paint';

  constructor(canvas: HTMLCanvasElement, { dir, count, painter }: FrameSequenceOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
    this.dir = dir;
    this.count = count;
    this.painter = painter;
    this.frames = new Array<HTMLImageElement | undefined>(count);
    this.mode = SAVE_DATA ? 'paint' : 'unknown';
    this.resize();
    on(window, 'resize', debounce(() => { this.resize(); this.render(true); }, 150));
  }
  src(i: number): string { return `${this.dir}/${String(i + 1).padStart(4, '0')}.webp`; }
  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile() ? 1.5 : 2);
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
  }
  order(): number[] {
    const out: number[] = [];
    const seen = new Set<number>();
    for (const step of [8, 4, 2, 1]) {
      for (let i = 0; i < this.count; i += step) if (!seen.has(i)) { seen.add(i); out.push(i); }
    }
    return out;
  }
  loadFrame(i: number): Promise<boolean> {
    this.requested.add(i);
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { this.frames[i] = img; resolve(true); };
      img.onerror = () => resolve(false);
      img.src = this.src(i);
    });
  }
  async probe(): Promise<boolean> {
    if (this.mode !== 'unknown') return this.mode === 'frames';
    const ok = await this.loadFrame(0);
    this.mode = ok ? 'frames' : 'paint';
    this.render(true);
    return ok;
  }
  async load(limit: number = this.count, onProgress?: (f: number) => void): Promise<void> {
    const ok = await this.probe();
    if (!ok) { if (onProgress) onProgress(1); return; }
    const queue = this.order().filter((i) => !this.requested.has(i)).slice(0, limit);
    const total = queue.length || 1;
    let done = 0;
    const worker = async (): Promise<void> => {
      while (queue.length) {
        const i = queue.shift() as number;
        await this.loadFrame(i);
        done++;
        if (onProgress) onProgress(done / total);
        if (Math.abs(i - this.target()) < 3) this.render(true);
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
    if (onProgress) onProgress(1);
    this.render(true);
  }
  target(): number { return Math.round(this.p * (this.count - 1)); }
  nearest(i: number): HTMLImageElement | null {
    for (let d = 1; d < this.count; d++) {
      const a = this.frames[i - d];
      if (a) return a;
      const b = this.frames[i + d];
      if (b) return b;
    }
    return null;
  }
  set(p: number): void { this.p = clamp(p, 0, 1); this.render(); }
  render(force = false): void {
    const { ctx } = this;
    const { width: w, height: h } = this.canvas;
    if (this.mode !== 'frames') { this.painter(ctx, w, h, this.p); return; }
    const i = this.target();
    if (i === this.current && !force) return;
    const img = this.frames[i] || this.nearest(i);
    if (!img) { this.painter(ctx, w, h, this.p); return; }
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    this.current = this.frames[i] ? i : -1;
  }
}

function createSequences(): FrameSequence[] {
  return CONFIG.scenes.map((s, i) => new FrameSequence($<HTMLCanvasElement>(s.canvas), {
    dir: `${s.dir}/${MOBILE_AT_LOAD ? 'mobile' : 'desktop'}`,
    count: MOBILE_AT_LOAD ? s.mobile : s.desktop,
    painter: PAINTERS[i],
  }));
}

/* =======================================================
   5. MARKUP BUILDERS (from SITE_DATA)
   ======================================================= */
function thumbImg(p: ResolvedProject, eager = false): string {
  return `<img src="${p.thumb}" alt="" ${eager ? '' : 'loading="lazy" '}decoding="async" draggable="false">`;
}

function wireThumb(holder: HTMLElement, p: ResolvedProject): void {
  const img = $<HTMLImageElement>('img', holder);
  const fail = (): void => {
    if (img) img.remove();
    holder.classList.add('is-placeholder');
    holder.style.setProperty('--c', p.color);
  };
  if (!img) { fail(); return; }
  if (img.complete && img.naturalWidth === 0) fail();
  else img.addEventListener('error', fail, { once: true });
}

function buildStats(): void {
  $('#statsList').innerHTML = SITE_DATA.stats.map((s) => `
    <li class="stat">
      <p class="stat__num">${s.value == null
        ? `<span>${esc(s.display || '')}</span>`
        : `<span class="stat__value" data-count="${s.value}">${s.value}</span><span class="stat__suffix">${esc(s.suffix || '')}</span>`}</p>
      <p class="stat__label">${esc(s.label)}</p>
    </li>`).join('');
}

function buildMarquee(): void {
  const items = SITE_DATA.industries.map((t) => `<span class="marquee__item">${esc(t)}</span><i class="marquee__sep"></i>`).join('');
  const group = (hidden: boolean): string => `<div class="marquee__group"${hidden ? ' aria-hidden="true"' : ''}>${items}${items}</div>`;
  $('#industryTrack').innerHTML = group(false) + group(true);
}

function buildHeroThumbs(): void {
  const wrap = $('#heroThumbs');
  wrap.innerHTML = PROJECTS.slice(0, 3).map((p) => `<div class="hero__thumb">${thumbImg(p, true)}</div>`).join('');
  $$('.hero__thumb', wrap).forEach((h, i) => wireThumb(h, PROJECTS[i]));
}

function buildWork(): void {
  const canvas = $('#workCanvas');
  canvas.innerHTML = PROJECTS.map((p, i) => `
    <button class="wcard" type="button" data-index="${i}" data-cursor="Open" aria-label="Open preview: ${esc(p.name)}">
      <span class="wcard__window">
        <span class="wcard__chrome" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="wcard__img">${thumbImg(p)}</span>
      </span>
      <span class="wcard__name">${esc(p.name)}</span>
    </button>`).join('');
  $$('.wcard', canvas).forEach((card, i) => wireThumb($('.wcard__img', card), PROJECTS[i]));

  $('#workList').innerHTML = PROJECTS.map((p, i) => `
    <li>
      <button class="wlist__item" type="button" data-index="${i}">
        <span class="wlist__num mono">${String(i + 1).padStart(2, '0')}</span>
        <span class="wlist__name">${esc(p.name)}</span>
        <span class="wlist__cat mono">${esc(p.category)}</span>
        <span aria-hidden="true">→</span>
      </button>
    </li>`).join('');
}

function postPlaceholder(i: number, ratio: Post['ratio']): string {
  const palettes: [string, string][] = [['#7C3AED', '#2E1065'], ['#FF8A4C', '#5B21B6'], ['#C4B5FD', '#16131F'], ['#8B5CF6', '#07060B']];
  const words = ['Launch', 'Bold', 'Story', 'Craft', 'Grow', 'Glow'];
  const [a, b] = palettes[i % palettes.length];
  const h = ratio === '4:5' ? 500 : 400;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 ${h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="400" height="${h}" fill="url(#g)"/>
    <circle cx="${300 - (i % 3) * 60}" cy="${120 + (i % 4) * 30}" r="${70 + (i % 3) * 20}" fill="rgba(255,255,255,0.12)"/>
    <text x="32" y="${h - 90}" font-family="Arial, sans-serif" font-weight="700" font-size="56" fill="#F5F3FF" letter-spacing="-2">${words[i % words.length]}</text>
    <text x="32" y="${h - 44}" font-family="monospace" font-size="15" fill="rgba(245,243,255,0.7)" letter-spacing="3">POST ${String(i + 1).padStart(2, '0')} · PLACEHOLDER</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// One strip that mixes reels and creative posts: reel, post, post, reel…
function buildStrip(): void {
  const reels: ReelItem[] = SITE_DATA.reels.map((r): ReelItem => ({ type: 'reel', ...r }));
  const posts: PostItem[] = SITE_DATA.posts.map((p, i): PostItem => ({ type: 'post', ...p, n: i, resolved: p.src || postPlaceholder(i, p.ratio) }));
  MEDIA = [];
  let r = 0, p = 0;
  while (r < reels.length || p < posts.length) {
    if (r < reels.length) MEDIA.push(reels[r++]);
    for (let k = 0; k < 2 && p < posts.length; k++) MEDIA.push(posts[p++]);
  }

  const tile = (m: MediaItem, i: number, hidden: boolean): string => {
    const hide = hidden ? ' aria-hidden="true" tabindex="-1"' : '';
    if (m.type === 'reel') {
      return `<button class="reel ${m.ratio === '9:16' ? 'reel--tall' : 'reel--wide'}" type="button" data-index="${i}" data-cursor="Play"${hidden ? hide : ` aria-label="Play ${esc(m.title)}"`} style="animation-delay:-${((i % 6) * 1.3).toFixed(1)}s">
        <video muted playsinline loop preload="none" ${m.poster ? `poster="${m.poster}"` : ''} data-src="${m.src || ''}" aria-hidden="true"></video>
        ${m.placeholder ? '<span class="reel__tag mono">Placeholder</span>' : ''}
        <span class="reel__meta"><span class="reel__title">${esc(m.title)}</span><span class="reel__play">Play</span></span>
      </button>`;
    }
    return `<button class="post post--${m.ratio === '4:5' ? 'portrait' : 'square'}" type="button" data-index="${i}" data-cursor="View"${hidden ? hide : ` aria-label="View ${esc(m.alt)}"`}><img src="${m.resolved}" alt="" loading="lazy" decoding="async" draggable="false"></button>`;
  };

  const track = $('#stripTrack');
  const html = (hidden: boolean): string => MEDIA.map((m, i) => tile(m, i, hidden)).join('');
  track.innerHTML = html(false) + html(true);

  $$<HTMLImageElement>('.post img', track).forEach((img) => {
    img.addEventListener('error', () => {
      const holder = img.closest<HTMLElement>('.post');
      const m = MEDIA[Number(holder?.dataset.index)] as PostItem;
      img.src = postPlaceholder(m.n, m.ratio);
    }, { once: true });
  });

  const fallback = (reel: HTMLElement): void => {
    reel.classList.add('is-fallback');
    const v = $('video', reel);
    if (v) v.remove();
  };
  const loadReel = (reel: HTMLElement): void => {
    const v = $<HTMLVideoElement>('video', reel);
    if (!v || !v.dataset.src) { fallback(reel); return; }
    v.addEventListener('error', () => fallback(reel), { once: true });
    v.addEventListener('loadeddata', () => { reel.dataset.ok = '1'; }, { once: true });
    v.src = v.dataset.src;
    v.preload = 'metadata';
    v.load();
  };
  const reelsEls = $$('.reel', track);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      loadReel(e.target as HTMLElement);
    }), { rootMargin: '300px' });
    reelsEls.forEach((el) => io.observe(el));
    disposers.push(() => io.disconnect());
  } else reelsEls.forEach(loadReel);

  if (FINE_POINTER && !REDUCED) {
    reelsEls.forEach((reel) => {
      reel.addEventListener('pointerenter', () => {
        const v = $<HTMLVideoElement>('video', reel);
        if (v && reel.dataset.ok === '1') { v.currentTime = 0; v.play().catch(() => {}); }
      });
      reel.addEventListener('pointerleave', () => { const v = $<HTMLVideoElement>('video', reel); if (v) v.pause(); });
    });
  }
  if (REDUCED) { const vp = $('.strip__viewport'); if (vp) vp.style.overflowX = 'auto'; }
}

function initImageFallbacks(): void {
  $$<HTMLImageElement>('img[data-fallback]').forEach((img) => {
    const swap = (): void => {
      const s = document.createElement('span');
      s.className = 'img-fallback';
      s.textContent = img.dataset.fallback ?? '';
      s.setAttribute('role', 'img');
      s.setAttribute('aria-label', img.alt || '');
      img.replaceWith(s);
    };
    if (img.complete && img.naturalWidth === 0) swap();
    else img.addEventListener('error', swap, { once: true });
  });
}

/* =======================================================
   6. SMOOTH SCROLL, PRELOADER
   ======================================================= */
function initLenis(): Lenis | null {
  if (REDUCED) return null;
  const l = new Lenis({
    duration: 1.15,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    syncTouch: false,
  });
  l.on('scroll', ScrollTrigger.update);
  tickerAdd((time) => l.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return l;
}

async function runPreloader(seq1: FrameSequence): Promise<void> {
  const out = $('.preloader__count span');
  let target = 4, shown = 0;
  const tick = (): void => {
    shown += (target - shown) * 0.12;
    if (out) out.textContent = String(Math.min(100, Math.round(shown)));
  };
  gsap.ticker.add(tick);
  const fonts = (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve())
    .then(() => { target = Math.max(target, 35); });
  const frames = seq1.load(30, (f) => { target = Math.max(target, 35 + f * 65); });
  await Promise.race([Promise.all([fonts, frames, wait(1200)]), wait(4000)]);
  target = 100;
  await wait(450);
  gsap.ticker.remove(tick);
  if (out) out.textContent = '100';
}

function finishLoading(): void {
  document.body.classList.remove('is-loading');
  const pre = $('#preloader');
  if (pre) pre.style.display = 'none';
  ScrollTrigger.refresh();
  if (lenis) lenis.start();
}

function exitPreloader(): void {
  gsap.timeline()
    .to('.preloader__inner', { autoAlpha: 0, y: -16, duration: 0.45, ease: 'power2.in' })
    .to('.preloader__panel--top', { yPercent: -100, duration: 1.1, ease: 'power4.inOut' }, '-=0.05')
    .to('.preloader__panel--bottom', { yPercent: 100, duration: 1.1, ease: 'power4.inOut' }, '<')
    .from('.hero__intro-title .w', {
      yPercent: 70, rotateX: -80, autoAlpha: 0, transformPerspective: 800, transformOrigin: '50% 100%',
      duration: 1.3, ease: 'expo.out', stagger: 0.09,
    }, '-=0.7')
    .from('.hero__hint > *', { autoAlpha: 0, y: 10, duration: 0.6, stagger: 0.08 }, '-=0.8')
    .call(finishLoading, undefined, 1.6);
}

/* =======================================================
   7. CINEMATIC SCENES
   ======================================================= */
interface SceneOpts { mobile: boolean }

function sceneTimeline(section: HTMLElement, seq: FrameSequence, length: number, onUpdate?: (self: ScrollTrigger) => void): gsap.core.Timeline {
  const proxy = { p: 0 };
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section, start: 'top top', end: `+=${length}%`,
      pin: true, scrub: 1, anticipatePin: 1, onUpdate,
    },
  });
  tl.to(proxy, { p: 1, duration: 1, onUpdate: () => seq.set(proxy.p) }, 0);
  seq.set(0);
  return tl;
}

function heroScene(seq: FrameSequence, { mobile }: SceneOpts): () => void {
  const section = $('#top');
  const ui = $('#heroUI');
  const canvas = $('#scene1');
  const intro = $('.hero__intro');
  const hint = $('.hero__hint');
  const count = $('.hero__count');
  const frame = $('.hero__frame');
  const meta = $('.hero__meta');
  const heroNav = $('.hero__nav');
  const S = heroScale();

  const pieces = $$('[data-piece]', ui).filter((el) => getComputedStyle(el).display !== 'none');
  gsap.set(ui, { scale: 1, x: 0, y: 0 });
  gsap.set(pieces, { clearProps: 'transform' });
  const ur = ui.getBoundingClientRect();
  const centers = pieces.map((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left - ur.left + r.width / 2, y: r.top - ur.top + r.height / 2 };
  });
  const k = mobile ? 0.5 : 1;
  const offX = (CONFIG.heroScreen.x - 0.5) * ur.width;
  const offY = (CONFIG.heroScreen.y - 0.5) * ur.height;

  gsap.set(ui, { scale: S, x: offX, y: offY, transformOrigin: '50% 50%' });
  gsap.set(pieces, { autoAlpha: 0 });
  gsap.set([frame, meta], { autoAlpha: 0 });

  const tl = sceneTimeline(section, seq, mobile ? CONFIG.pace.heroMobile : CONFIG.pace.hero, (self) => {
    if (count) count.textContent = `${Math.round(self.progress * 100)}%`;
    setNavVisible(self.progress > 0.96);
  });
  heroST = tl.scrollTrigger ?? null;

  tl.to(intro, { autoAlpha: 0, yPercent: -25, duration: 0.1 }, 0)
    .to(hint, { autoAlpha: 0, duration: 0.05 }, 0)
    .to(frame, { autoAlpha: 1, duration: 0.04 }, 0.27);

  const step = mobile ? 0.08 : 0.055;
  pieces.forEach((el, i) => {
    const [fx = 0, fy = 0, fr = 0] = (el.dataset.from || '').split(',').map(Number);
    const t = 0.3 + i * step;
    tl.fromTo(el, { x: fx * k, y: fy * k, rotation: fr }, { x: 0, y: 0, rotation: 0, duration: 0.09, ease: 'back.out(1.8)' }, t)
      .to(el, { autoAlpha: 1, duration: 0.015 }, t);
  });

  let fake: HTMLDivElement | null = null;
  if (!mobile) {
    const cursorEl = document.createElement('div');
    fake = cursorEl;
    cursorEl.setAttribute('aria-hidden', 'true');
    cursorEl.innerHTML = '<svg viewBox="0 0 24 24" width="44" height="44"><path d="M5 3l14 7.5-6.2 1.8L10 18.5z" fill="#F5F3FF" stroke="#7C3AED" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    Object.assign(cursorEl.style, {
      position: 'absolute', left: '0', top: '0', zIndex: '6', pointerEvents: 'none',
      filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.6))',
    });
    ui.appendChild(cursorEl);
    gsap.set(cursorEl, { x: ur.width * 0.8, y: ur.height * 1.1, autoAlpha: 0 });
    tl.to(cursorEl, { autoAlpha: 1, duration: 0.02 }, 0.27);
    pieces.forEach((el, i) => {
      const [fx = 0, fy = 0] = (el.dataset.from || '').split(',').map(Number);
      const t = 0.3 + i * step;
      const c = centers[i];
      tl.to(cursorEl, { x: c.x + fx - 9, y: c.y + fy - 6, duration: 0.012, ease: 'power2.out' }, t - 0.014)
        .to(cursorEl, { x: c.x - 9, y: c.y - 6, duration: 0.04, ease: 'power2.inOut' }, t);
    });
    tl.to(cursorEl, { autoAlpha: 0, duration: 0.03 }, 0.68);
  }

  tl.to(meta, { autoAlpha: 1, duration: 0.04 }, 0.66)
    .to(ui, { scale: 1, x: 0, y: 0, duration: 0.25, ease: 'power2.inOut' }, 0.7)
    .to(frame, { autoAlpha: 0, duration: 0.06 }, 0.88)
    .to(canvas, { autoAlpha: 0, duration: 0.08 }, 0.92)
    .to(heroNav, { autoAlpha: 0, duration: 0.03 }, 0.97);

  gsap.to('.hero__thumb', {
    y: (i: number) => -8 - i * 4, duration: (i: number) => 2.6 + i * 0.5,
    ease: 'sine.inOut', yoyo: true, repeat: -1,
  });

  return () => { if (fake) fake.remove(); };
}

function builderScene(seq: FrameSequence, { mobile }: SceneOpts): void {
  const tl = sceneTimeline($('#builder'), seq, mobile ? CONFIG.pace.sceneMobile : CONFIG.pace.scene);
  tl.fromTo('.builder__caption', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.08, ease: 'power2.out' }, 0.03)
    .to('.builder__caption', { autoAlpha: 0, y: -40, duration: 0.08, ease: 'power2.in' }, 0.55)
    .to('#scene2', { autoAlpha: 0, duration: 0.1 }, 0.88)
    .fromTo('.builder__reveal',
      { autoAlpha: 0, scale: 1.04, filter: 'blur(12px)' },
      { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 0.1, ease: 'power2.out' }, 0.88);
}

function ctaScene(seq: FrameSequence, { mobile }: SceneOpts): void {
  const tl = sceneTimeline($('#contact-scene'), seq, mobile ? CONFIG.pace.sceneMobile : CONFIG.pace.scene);
  tl.fromTo('.cta__caption', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.04)
    .to('.cta__swap', { yPercent: -50, duration: 0.06, ease: 'power3.inOut' }, 0.32)
    .to('.cta__caption', { autoAlpha: 0, y: -30, duration: 0.06 }, 0.58)
    .fromTo('.cta__screen', { autoAlpha: 0, scale: 0.42 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'power2.inOut' }, 0.62)
    .to('#scene3', { autoAlpha: 0, duration: 0.1 }, 0.88);
}

function staticScenes(seqs: FrameSequence[]): void {
  seqs.forEach((s) => s.set(1));
  gsap.set('.hero__intro, .hero__hint, .builder__caption, .cta__caption', { autoAlpha: 0 });
  gsap.set('#heroUI', { scale: 1, x: 0, y: 0 });
  gsap.set('.builder__reveal, .cta__screen', { autoAlpha: 1 });
  setNavVisible(true);
}

/* =======================================================
   8. SECTION MOTION
   ======================================================= */
function missionScene({ mobile }: SceneOpts): Cleanup {
  const splits = $$('#mission [data-fill]').map((el) => SplitText.create(el, { type: 'words', wordsClass: 'fill-word' }));
  const words = splits.flatMap((s) => s.words as HTMLElement[]);
  const hl = $('#mission .hl');
  gsap.set(words, { opacity: 0.15 });
  gsap.timeline({
    scrollTrigger: {
      trigger: '#mission', start: 'top top',
      end: `+=${mobile ? CONFIG.pace.missionMobile : CONFIG.pace.mission}%`,
      pin: true, scrub: 1, anticipatePin: 1,
      onUpdate: (self) => { if (hl) hl.classList.toggle('is-lit', self.progress > 0.5); },
    },
  }).to(words, { opacity: 1, ease: 'none', stagger: 0.12, duration: 0.4 });
  return () => splits.forEach((s) => s.revert());
}

function initSplits(): void {
  if (REDUCED) return;
  $$('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
      onSplit(self: SplitText) {
        return gsap.from(self.lines, {
          yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.08,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        });
      },
    });
  });
}

function initScrambles(): void {
  if (REDUCED) return;
  $$('[data-scramble]').forEach((el) => {
    const text = el.textContent ?? '';
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => scramble(el, text) });
  });
}

function initReveals(): void {
  if (REDUCED) return;
  $$('[data-reveal]').forEach((el) => gsap.from(el, {
    y: 60, autoAlpha: 0, duration: 1.2, ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
  }));
}

function initStats(): void {
  if (REDUCED) return;
  const vals = $$('#statsList .stat__value');
  vals.forEach((v) => { v.textContent = '0'; });
  ScrollTrigger.create({
    trigger: '#statsList', start: 'top 85%', once: true,
    onEnter: () => {
      vals.forEach((v, i) => {
        const o = { n: 0 };
        gsap.to(o, {
          n: Number(v.dataset.count), duration: 1.6, delay: i * 0.12, ease: 'power3.out',
          onUpdate: () => { v.textContent = String(Math.round(o.n)); },
        });
      });
      gsap.from('#statsList .stat__label', { autoAlpha: 0, y: 12, duration: 0.8, stagger: 0.12, delay: 0.5 });
    },
  });
}

function initWordmark(): void {
  const wm = $('.wordmark');
  if (!wm) return;
  if (REDUCED) { wm.style.setProperty('--fill', '100%'); return; }
  gsap.fromTo(wm, { '--fill': '0%' }, {
    '--fill': '100%', ease: 'none',
    scrollTrigger: { trigger: wm, start: 'top bottom', end: 'bottom 80%', scrub: true },
  });
}

function lazyLoadScenes(seqs: FrameSequence[]): void {
  const sections: Array<HTMLElement | null> = [null, $<HTMLElement>('#builder'), $<HTMLElement>('#contact-scene')];
  seqs.forEach((seq, i) => {
    if (i === 0) return;
    const section = sections[i] as HTMLElement;
    if (!('IntersectionObserver' in window)) { void seq.load(); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { io.disconnect(); void seq.load(); }
    }, { rootMargin: '150% 0px' });
    io.observe(section);
    disposers.push(() => io.disconnect());
  });
}

/* =======================================================
   9. ENDLESS MARQUEES (industries + media strip)
   ======================================================= */
const LOOPS: Loop[] = [];

function addLoop(track: HTMLElement, { speed, dir = -1, skew = false }: { speed: number; dir?: number; skew?: boolean }): Loop {
  const L: Loop = { track, speed, dir, skew, x: 0, half: 0, sk: 0, paused: false, visible: true, measure: () => {} };
  L.measure = () => {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    L.half = (track.scrollWidth + gap) / 2;
    if (L.dir > 0 && L.x === 0) L.x = -L.half;
  };
  L.measure();
  LOOPS.push(L);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([e]) => { L.visible = e.isIntersecting; });
    io.observe(track.parentElement as HTMLElement);
    disposers.push(() => io.disconnect());
  }
  return L;
}

function initLoops(): void {
  if (REDUCED) return;
  LOOPS.length = 0;
  addLoop($('#industryTrack'), { speed: 45, dir: -1, skew: true });
  const strip = $('#stripTrack');
  const S = addLoop(strip, { speed: 32, dir: -1 });
  strip.addEventListener('pointerenter', () => { S.paused = true; });
  strip.addEventListener('pointerleave', () => { S.paused = false; });
  on(window, 'resize', debounce(() => LOOPS.forEach((L) => L.measure()), 200));
  on(window, 'load', () => LOOPS.forEach((L) => L.measure()));
  tickerAdd((_time, dt) => {
    const v = lenis ? lenis.velocity : 0;
    const boost = 1 + Math.min(Math.abs(v) * 0.06, 3);
    LOOPS.forEach((L) => {
      if (!L.half || !L.visible) return;
      if (!L.paused) {
        L.x += L.dir * L.speed * boost * (dt / 1000);
        if (L.x <= -L.half) L.x += L.half;
        if (L.x > 0) L.x -= L.half;
      }
      let tf = `translate3d(${L.x.toFixed(2)}px,0,0)`;
      if (L.skew) {
        L.sk += (clamp(-v * 0.35, -8, 8) - L.sk) * 0.1;
        tf += ` skewX(${L.sk.toFixed(2)}deg)`;
      }
      L.track.style.transform = tf;
    });
  });
}

/* =======================================================
   10. NAVIGATION, MENU, ANCHORS, PROGRESS
   ======================================================= */
function initNav(): void {
  const nav = $('#nav');
  const links = $$<HTMLAnchorElement>('.navbar__links a[data-link]', nav);
  const ind = $('.navbar__indicator', nav);
  const setActive = (key: string | null): void => {
    links.forEach((a) => a.classList.toggle('is-active', a.dataset.link === key));
    const a = links.find((l) => l.dataset.link === key);
    if (!ind) return;
    if (a) {
      ind.style.width = `${a.offsetWidth}px`;
      ind.style.transform = `translateX(${a.offsetLeft}px)`;
      ind.style.opacity = '1';
    } else ind.style.opacity = '0';
  };
  $$('[data-nav]').forEach((sec) => ScrollTrigger.create({
    trigger: sec, start: 'top 55%', end: 'bottom 55%',
    onToggle: (self) => { if (self.isActive) setActive(sec.dataset.nav ?? null); },
  }));
  ScrollTrigger.create({ trigger: '#top', start: 'top top', end: 'bottom 55%', onEnterBack: () => setActive(null) });
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      const heroEnd = heroST ? heroST.end : window.innerHeight;
      nav.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > heroEnd + 120 && !menuOpen);
    },
  });
}

function initProgress(): void {
  const bar = $('.progress span');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => { bar.style.transform = `scaleX(${self.progress.toFixed(4)})`; },
  });
}

function initMenu(): void {
  const nav = $('#nav');
  const btn = $('.navbar__menu', nav);
  const menu = $('#menu');
  if (!btn || !menu) return;
  menu.style.zIndex = '790';
  setMenu = (open: boolean): void => {
    menuOpen = open;
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Close' : 'Menu';
    nav.classList.remove('is-hidden');
    if (open) {
      menu.hidden = false;
      if (lenis) lenis.stop();
      if (!REDUCED) {
        gsap.fromTo(menu, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35 });
        gsap.fromTo($$('.menu__link span', menu), { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 });
      }
      const first = $('a', menu);
      if (first) first.focus();
    } else {
      menu.hidden = true;
      if (lenis) lenis.start();
    }
  };
  btn.addEventListener('click', () => setMenu(!menuOpen));
  on(document, 'keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) { setMenu(false); btn.focus(); }
  });
}

function initAnchors(): void {
  on(document, 'click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href') ?? '';
    if (id === '#' || id === '#main') return;
    const target: HTMLElement | 0 | null = id === '#top' ? 0 : document.querySelector<HTMLElement>(id);
    if (target == null) return;
    e.preventDefault();
    if (menuOpen) setMenu(false);
    scrollToTarget(target);
  });
  const toTop = $('#toTop');
  if (toTop) toTop.addEventListener('click', () => scrollToTarget(0, 2));
}

/* =======================================================
   11. POINTER EFFECTS (desktop)
   ======================================================= */
function initCursor(): void {
  const cursor = $('.cursor');
  const dot = $('.cursor__dot');
  const ring = $('.cursor__ring');
  const label = $('.cursor__label');
  root.classList.add('has-cursor');
  gsap.set([dot, ring], { x: -100, y: -100 });
  const dx = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3' });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3' });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });

  on(window, 'pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    cursor.classList.remove('is-hidden');
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));

  on(document, 'pointerover', (e) => {
    const t = e.target as HTMLElement;
    if (!t.closest) return;
    const labelled = t.closest<HTMLElement>('[data-cursor]');
    const link = t.closest('a, button, label, [role="button"]');
    if (labelled) {
      cursor.classList.add('is-label');
      cursor.classList.remove('is-link');
      label.textContent = labelled.dataset.cursor ?? '';
    } else if (link) {
      cursor.classList.add('is-link');
      cursor.classList.remove('is-label');
    } else cursor.classList.remove('is-label', 'is-link');
  });
}

function initMagnetic(): void {
  $$('.magnetic').forEach((el) => {
    const label = $('.btn__label', el);
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: mx * 0.35, y: my * 0.35, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
      if (label) gsap.to(label, { x: mx * 0.15, y: my * 0.15, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
      if (label) gsap.to(label, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
    });
  });
}

function initGlow(): void {
  $$('.glow').forEach((el) => el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true }));
  const canvas = $('#workCanvas');
  if (canvas) canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    canvas.style.setProperty('--bx', `${e.clientX - r.left}px`);
    canvas.style.setProperty('--by', `${e.clientY - r.top}px`);
  }, { passive: true });
}

/* =======================================================
   12. WORK BROWSER (drag, throw, tidy, filter, list)
   ======================================================= */
const WORK: { mode: 'scatter' | 'tidy'; drags: Draggable[]; useDrag: boolean; entered: boolean } = {
  mode: 'scatter', drags: [], useDrag: false, entered: false,
};

interface CardTarget { x: number; y: number; rotation: number; scale: number }

function layoutCards(animate: boolean): void {
  if (isMobile()) return;
  const canvas = $('#workCanvas');
  const cards = $$('.wcard', canvas);
  const cw = canvas.clientWidth, ch = canvas.clientHeight;
  if (!cw || !cards.length) return;
  const cardW = cards[0].offsetWidth, cardH = cards[0].offsetHeight;
  let targets: CardTarget[];

  if (WORK.mode === 'tidy') {
    const gap = 20, pad = 24;
    const cols = Math.max(1, Math.floor((cw - pad * 2 + gap) / (cardW + gap)));
    const rows = Math.ceil(cards.length / cols);
    const s = Math.min(1, (ch - pad * 2 - gap * (rows - 1)) / (rows * cardH));
    const vw = cardW * s, vh = cardH * s;
    const ox = (cw - (cols * vw + (cols - 1) * gap)) / 2;
    const oy = (ch - (rows * vh + (rows - 1) * gap)) / 2;
    targets = cards.map((_c, i) => ({
      x: ox + (i % cols) * (vw + gap) - (cardW - vw) / 2,
      y: oy + Math.floor(i / cols) * (vh + gap) - (cardH - vh) / 2,
      rotation: 0, scale: s,
    }));
  } else {
    targets = cards.map((_c, i) => {
      const [nx, ny, r] = CONFIG.scatter[i % CONFIG.scatter.length];
      return { x: nx * (cw - cardW), y: ny * (ch - cardH), rotation: r, scale: 1 };
    });
  }
  cards.forEach((c, i) => { c.dataset.rot = String(targets[i].rotation); });

  const vars = {
    x: (i: number) => targets[i].x, y: (i: number) => targets[i].y,
    rotation: (i: number) => targets[i].rotation, scale: (i: number) => targets[i].scale,
  };
  if (animate && !REDUCED) {
    gsap.to(cards, { ...vars, duration: 0.9, ease: 'back.out(1.3)', stagger: 0.03, onComplete: () => WORK.drags.forEach((d) => d.update()) });
  } else {
    gsap.set(cards, vars);
    WORK.drags.forEach((d) => d.update());
  }
}

function settleCard(target: Element): void {
  gsap.to(target, { rotation: Number((target as HTMLElement).dataset.rot) || 0, duration: 1.1, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' });
}

function tiltCard(drag: DragEx): void {
  const vx = drag.x - (drag._lx == null ? drag.x : drag._lx);
  drag._lx = drag.x;
  gsap.to(drag.target, { rotation: clamp(vx * 1.4, -14, 14), duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
}

function cardEntry(cards: HTMLElement[], mobile: boolean): void {
  if (WORK.entered || REDUCED) return;
  gsap.set(cards, { autoAlpha: 0 });
  ScrollTrigger.create({
    trigger: '#workCanvas', start: 'top 80%', once: true,
    onEnter: () => {
      WORK.entered = true;
      gsap.to(cards, { autoAlpha: 1, duration: 0.5, stagger: 0.06 });
      if (!mobile) gsap.from(cards, { y: '-=260', duration: 1.1, ease: 'back.out(1.6)', stagger: 0.06 });
    },
  });
}

function initWorkLayout({ mobile }: SceneOpts): Cleanup {
  const canvas = $('#workCanvas');
  const cards = $$('.wcard', canvas);
  if (mobile) {
    WORK.useDrag = false;
    gsap.set(cards, { clearProps: 'transform' });
    cardEntry(cards, true);
    return null;
  }
  layoutCards(false);
  if (!REDUCED) {
    WORK.useDrag = true;
    WORK.drags = Draggable.create(cards, {
      type: 'x,y',
      bounds: canvas,
      inertia: true,
      edgeResistance: 0.85,
      zIndexBoost: true,
      minimumMovement: 6,
      dragClickables: true,
      onPress() { (this.target as HTMLElement).classList.add('is-dragging'); (this as DragEx)._lx = this.x; },
      onDrag() { tiltCard(this as DragEx); },
      onThrowUpdate() { tiltCard(this as DragEx); },
      onRelease() { (this.target as HTMLElement).classList.remove('is-dragging'); if (!this.isThrowing) settleCard(this.target); },
      onThrowComplete() { settleCard(this.target); },
      onClick() { const el = this.target as HTMLElement; openPreview(Number(el.dataset.index), el); },
    });
  }
  cardEntry(cards, false);
  const onResize = debounce(() => layoutCards(false), 200);
  window.addEventListener('resize', onResize);
  return () => {
    window.removeEventListener('resize', onResize);
    WORK.drags.forEach((d) => d.kill());
    WORK.drags = [];
    WORK.useDrag = false;
  };
}

function initWorkControls(): void {
  const browser = $('#browser');
  const canvas = $('#workCanvas');
  const list = $('#workList');

  canvas.addEventListener('click', (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('.wcard');
    if (!card) return;
    if (!WORK.useDrag || e.detail === 0) openPreview(Number(card.dataset.index), card);
  });
  list.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('.wlist__item');
    if (b) openPreview(Number(b.dataset.index), b);
  });

  const tabs = $$('.browser__tabs .tab');
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    tabs.forEach((t) => {
      const isOn = t === tab;
      t.classList.toggle('is-active', isOn);
      t.setAttribute('aria-selected', String(isOn));
    });
    const f = tab.dataset.filter ?? 'all';
    const matches = (i: number): boolean => f === 'all' || PROJECTS[i].filters.includes(f as ResolvedProject['filters'][number]);
    $$('.wcard', canvas).forEach((c, i) => {
      const match = matches(i);
      c.classList.toggle('is-dim', !match);
      c.tabIndex = match ? 0 : -1;
    });
    $$('li', list).forEach((li, i) => { li.hidden = !matches(i); });
  }));

  const tools = $$('.tool[data-layout]');
  tools.forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.layout === WORK.mode));
    btn.addEventListener('click', () => {
      WORK.mode = btn.dataset.layout === 'tidy' ? 'tidy' : 'scatter';
      tools.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      layoutCards(true);
    });
  });

  const toggle = $('#listToggle');
  toggle.addEventListener('click', () => {
    const isOn = !browser.classList.contains('is-list');
    browser.classList.toggle('is-list', isOn);
    list.hidden = !isOn;
    toggle.setAttribute('aria-pressed', String(isOn));
    toggle.textContent = isOn ? 'View as canvas' : 'View as list';
    if (!isOn) layoutCards(false);
    ScrollTrigger.refresh();
  });
}

/* =======================================================
   13. PROJECT PREVIEW
   ======================================================= */
const PV: { index: number; origin: HTMLElement | null; live: boolean } = { index: 0, origin: null, live: false };

function renderPreviewView(p: ResolvedProject): void {
  const view = $('#pvView');
  view.scrollTop = 0;
  if (PV.live && p.allowIframe) {
    view.innerHTML = `<iframe class="preview__frame" src="${p.url}" title="${esc(p.name)} live preview" loading="lazy"></iframe>`;
    return;
  }
  view.innerHTML = '';
  const img = new Image();
  img.className = 'preview__shot';
  img.alt = `Full-page screenshot of ${p.name}`;
  img.decoding = 'async';
  img.onerror = () => {
    view.innerHTML = `<div class="preview__placeholder" style="--c:${p.color}"><span>${esc(p.name)}</span></div>`;
  };
  img.src = p.full;
  view.appendChild(img);
}

function fillPreview(p: ResolvedProject): void {
  $('#pvCat').textContent = p.category;
  $('#pvTitle').textContent = p.name;
  $('#pvRole').textContent = p.role || '';
  $('#pvSummary').textContent = p.summary;
  $('#pvTags').innerHTML = (p.deliverables || []).map((d) => `<li>${esc(d)}</li>`).join('');
  const visit = $<HTMLAnchorElement>('#pvVisit');
  visit.href = p.url;
  visit.setAttribute('aria-label', `Visit ${p.name} (opens in a new tab)`);
  const live = $<HTMLButtonElement>('#pvLive');
  live.hidden = !p.allowIframe;
  PV.live = false;
  $('.btn__label', live).textContent = 'Try live preview';
  renderPreviewView(p);
  scramble($<HTMLElement>('#address'), p.url.replace(/^https?:\/\//, '').replace(/\/$/, ''), { chars: LOWER, duration: 500 });
}

function pvKeys(e: KeyboardEvent): void {
  if (e.key === 'Escape') closePreview();
  else if (e.key === 'ArrowRight') showProject(PV.index + 1);
  else if (e.key === 'ArrowLeft') showProject(PV.index - 1);
  else if (e.key === 'Tab') trapFocus($('.preview__panel'), e);
}

function showProject(i: number): void {
  PV.index = (i + PROJECTS.length) % PROJECTS.length;
  const parts = [$('#pvView'), $('.preview__info')];
  if (!REDUCED) {
    gsap.to(parts, {
      autoAlpha: 0, duration: 0.2,
      onComplete: () => { fillPreview(PROJECTS[PV.index]); gsap.to(parts, { autoAlpha: 1, duration: 0.35 }); },
    });
  } else fillPreview(PROJECTS[PV.index]);
}

function openPreview(i: number, origin?: HTMLElement | null): void {
  const pv = $('#preview');
  const panel = $('.preview__panel', pv);
  PV.index = (i + PROJECTS.length) % PROJECTS.length;
  PV.origin = origin || (document.activeElement as HTMLElement | null);
  fillPreview(PROJECTS[PV.index]);
  pv.hidden = false;
  if (lenis) lenis.stop();
  document.addEventListener('keydown', pvKeys);

  if (!REDUCED) {
    gsap.set(panel, { clearProps: 'transform,opacity' });
    gsap.set([$('#pvView'), $('.preview__info')], { autoAlpha: 1 });
    gsap.fromTo($('.preview__backdrop', pv), { opacity: 0 }, { opacity: 1, duration: 0.4 });
    if (isMobile()) {
      gsap.fromTo(panel, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: 'expo.out' });
    } else {
      const pr = panel.getBoundingClientRect();
      const r = origin && origin.getBoundingClientRect ? origin.getBoundingClientRect() : null;
      const from = r && r.width
        ? {
          x: r.left + r.width / 2 - (pr.left + pr.width / 2),
          y: r.top + r.height / 2 - (pr.top + pr.height / 2),
          scale: clamp(r.width / pr.width, 0.15, 0.9), opacity: 0.3,
        }
        : { scale: 0.92, opacity: 0 };
      gsap.fromTo(panel, from, { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.75, ease: 'expo.out' });
    }
  }
  requestAnimationFrame(() => $('.preview__close', pv).focus());
}

function closePreview(): void {
  const pv = $('#preview');
  if (pv.hidden) return;
  const panel = $('.preview__panel', pv);
  document.removeEventListener('keydown', pvKeys);
  const done = (): void => {
    pv.hidden = true;
    $('#pvView').innerHTML = '';
    panel.style.transform = '';
    if (lenis) lenis.start();
    if (PV.origin && PV.origin.focus) PV.origin.focus({ preventScroll: true });
    scramble($<HTMLElement>('#address'), ADDRESS_DEFAULT, { chars: LOWER, duration: 400 });
  };
  if (!REDUCED) {
    gsap.to($('.preview__backdrop', pv), { opacity: 0, duration: 0.3 });
    gsap.to(panel, isMobile()
      ? { yPercent: 100, duration: 0.4, ease: 'power3.in', onComplete: done }
      : { scale: 0.92, opacity: 0, duration: 0.35, ease: 'power3.in', onComplete: done });
  } else done();
}

function initPreview(): void {
  const pv = $('#preview');
  $$('[data-close]', pv).forEach((el) => el.addEventListener('click', closePreview));
  $('#pvNext').addEventListener('click', () => showProject(PV.index + 1));
  $('#pvLive').addEventListener('click', () => {
    PV.live = !PV.live;
    $('.btn__label', $('#pvLive')).textContent = PV.live ? 'Show screenshot' : 'Try live preview';
    renderPreviewView(PROJECTS[PV.index]);
  });
  const view = $('#pvView');
  view.tabIndex = 0;
  view.setAttribute('aria-label', 'Project preview, scrollable');

  const panel = $('.preview__panel', pv);
  let y0: number | null = null, dy = 0;
  panel.addEventListener('touchstart', (e) => {
    if (!isMobile()) return;
    const r = panel.getBoundingClientRect();
    const t = e.touches[0];
    if (t.clientY - r.top > 56) return;
    y0 = t.clientY; dy = 0;
  }, { passive: true });
  panel.addEventListener('touchmove', (e) => {
    if (y0 === null) return;
    dy = Math.max(0, e.touches[0].clientY - y0);
    panel.style.transform = `translateY(${dy}px)`;
  }, { passive: true });
  panel.addEventListener('touchend', () => {
    if (y0 === null) return;
    y0 = null;
    if (dy > 120) closePreview(); else panel.style.transform = '';
  });
}

/* =======================================================
   14. LIGHTBOX (media strip)
   ======================================================= */
const LB: { index: number; origin: HTMLElement | null } = { index: 0, origin: null };

function renderLightbox(): void {
  const body = $('#lbBody');
  const it = MEDIA[LB.index];
  $$<HTMLVideoElement>('video', body).forEach((v) => v.pause());
  body.innerHTML = '';
  if (it.type === 'reel') {
    const ok = $$(`#stripTrack .reel[data-index="${LB.index}"]`).some((el) => el.dataset.ok === '1');
    if (ok) {
      const v = document.createElement('video');
      v.className = 'lightbox__media';
      v.src = it.src;
      v.controls = true;
      v.autoplay = true;
      v.loop = true;
      v.playsInline = true;
      v.setAttribute('aria-label', it.title);
      body.appendChild(v);
      v.play().catch(() => {});
    } else {
      body.innerHTML = `<div class="lightbox__media reel is-fallback ${it.ratio === '9:16' ? 'reel--tall' : 'reel--wide'}" style="height:min(70vh,640px)">
        <span class="reel__tag mono">Placeholder</span>
        <span class="reel__meta"><span class="reel__title">${esc(it.title)} · coming soon</span></span></div>`;
    }
  } else {
    const img = new Image();
    img.className = 'lightbox__media';
    img.alt = it.alt;
    img.src = it.resolved;
    body.appendChild(img);
  }
}

function stepLightbox(d: number): void {
  LB.index = (LB.index + d + MEDIA.length) % MEDIA.length;
  renderLightbox();
}

function lbKeys(e: KeyboardEvent): void {
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowRight') stepLightbox(1);
  else if (e.key === 'ArrowLeft') stepLightbox(-1);
  else if (e.key === 'Tab') trapFocus($('#lightbox'), e);
}

function openLightbox(index: number, origin: HTMLElement): void {
  const lb = $('#lightbox');
  LB.index = index; LB.origin = origin;
  renderLightbox();
  lb.hidden = false;
  if (lenis) lenis.stop();
  document.addEventListener('keydown', lbKeys);
  if (!REDUCED) {
    gsap.fromTo(lb, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35 });
    gsap.fromTo('#lbBody', { scale: 0.94 }, { scale: 1, duration: 0.6, ease: 'expo.out' });
  }
  requestAnimationFrame(() => $('.lightbox__close', lb).focus());
}

function closeLightbox(): void {
  const lb = $('#lightbox');
  if (lb.hidden) return;
  document.removeEventListener('keydown', lbKeys);
  const done = (): void => {
    $$<HTMLVideoElement>('#lbBody video').forEach((v) => v.pause());
    $('#lbBody').innerHTML = '';
    lb.hidden = true;
    if (lenis) lenis.start();
    if (LB.origin && LB.origin.focus) LB.origin.focus({ preventScroll: true });
  };
  if (!REDUCED) {
    gsap.to(lb, { autoAlpha: 0, duration: 0.25, onComplete: () => { done(); gsap.set(lb, { clearProps: 'opacity,visibility' }); } });
  } else done();
}

function initLightbox(): void {
  const lb = $('#lightbox');
  const prev = document.createElement('button');
  prev.className = 'lightbox__prev'; prev.type = 'button'; prev.setAttribute('aria-label', 'Previous'); prev.textContent = '‹';
  const next = document.createElement('button');
  next.className = 'lightbox__next'; next.type = 'button'; next.setAttribute('aria-label', 'Next'); next.textContent = '›';
  lb.append(prev, next);
  prev.addEventListener('click', () => stepLightbox(-1));
  next.addEventListener('click', () => stepLightbox(1));
  $$('[data-close]', lb).forEach((el) => el.addEventListener('click', closeLightbox));
  $('#stripTrack').addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.reel, .post');
    if (el) openLightbox(Number(el.dataset.index), el);
  });
}

/* =======================================================
   15. CONTACT FORM
   ======================================================= */
function formSuccess(form: HTMLFormElement): void {
  const done = $('#formDone');
  const title = $('.form-done__title', done);
  const show = (): void => {
    form.style.display = 'none';
    done.hidden = false;
    typeText(title, 'Got it — talk soon.');
  };
  if (!REDUCED) {
    gsap.to(form, {
      autoAlpha: 0, y: -20, duration: 0.45, ease: 'power2.in',
      onComplete: () => {
        show();
        gsap.from(done, { autoAlpha: 0, y: 20, duration: 0.6, ease: 'expo.out' });
        ScrollTrigger.refresh();
      },
    });
    gsap.fromTo('.contact__panel',
      { boxShadow: '0 0 0 1px rgba(196,181,253,0.4), 0 0 160px -20px rgba(139,92,246,0.9)' },
      { boxShadow: '0 0 0 1px rgba(196,181,253,0.14), 0 60px 160px -60px rgba(124,58,237,0.7)', duration: 1.6, ease: 'power2.out', clearProps: 'boxShadow' });
  } else show();
}

function initForm(): void {
  const form = $<HTMLFormElement>('#quoteForm');
  if (!form) return;
  const btn = $('.submit', form);
  const status = $('#formStatus');
  const fields: Record<FieldKey, FieldEl> = {
    name: $<HTMLInputElement>('#f-name'),
    email: $<HTMLInputElement>('#f-email'),
    message: $<HTMLTextAreaElement>('#f-msg'),
  };
  const keys = Object.keys(fields) as FieldKey[];
  const rules: Record<FieldKey, (v: string) => string> = {
    name: (v) => (v.trim() ? '' : 'Enter your name.'),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Enter a valid email address.'),
    message: (v) => (v.trim().length >= 2 ? '' : 'Tell me a little about your project.'),
  };
  const showErr = (key: FieldKey, msg: string): void => {
    const f = fields[key];
    f.closest('.field')?.classList.toggle('is-invalid', !!msg);
    f.setAttribute('aria-invalid', msg ? 'true' : 'false');
    $(`#err-${key}`).textContent = msg;
  };
  const checkNeed = (): boolean => {
    const ok = $$('input[name="need"]:checked', form).length > 0;
    $('#err-need').textContent = ok ? '' : 'Pick at least one option.';
    return ok;
  };

  keys.forEach((key) => {
    const f = fields[key];
    f.addEventListener('blur', () => { if (f.value) showErr(key, rules[key](f.value)); });
    f.addEventListener('input', () => { if (!rules[key](f.value)) showErr(key, ''); });
  });
  $$('input[name="need"]', form).forEach((cb) => cb.addEventListener('change', () => {
    if ($('#err-need').textContent) checkNeed();
  }));
  fields.message.addEventListener('input', () => {
    fields.message.style.height = 'auto';
    fields.message.style.height = `${fields.message.scrollHeight}px`;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let firstBad: HTMLElement | null = null;
    keys.forEach((key) => {
      const msg = rules[key](fields[key].value);
      showErr(key, msg);
      if (msg && !firstBad) firstBad = fields[key];
    });
    if (!checkNeed() && !firstBad) firstBad = $<HTMLElement>('input[name="need"]', form);
    if (firstBad) { (firstBad as HTMLElement).focus(); return; }

    const data = new FormData(form);
    const payload = {
      name: String(data.get('name')).trim(),
      email: String(data.get('email')).trim(),
      phone: String(data.get('phone') || '').trim() || 'Not given',
      need: data.getAll('need').join(', '),
      budget: String(data.get('budget') || 'Not given'),
      message: String(data.get('message')).trim(),
    };
    const { formEndpoint, formKey, email: toEmail } = SITE_DATA.contact;
    const isFormspree = /formspree\.io/.test(formEndpoint);
    status.classList.remove('is-error');

    if (!formKey && !isFormspree) {
      const body = Object.entries(payload).map(([k, v]) => `${k[0].toUpperCase()}${k.slice(1)}: ${v}`).join('\n');
      window.location.href = `mailto:${toEmail}?subject=${encodeURIComponent(`Quote request — ${payload.name}`)}&body=${encodeURIComponent(body)}`;
      status.textContent = 'Opening your email app…';
      return;
    }

    btn.classList.add('is-loading');
    status.textContent = 'Sending…';
    try {
      const body = isFormspree
        ? payload
        : { access_key: formKey, subject: `New quote request — ${payload.name}`, from_name: 'Portfolio contact form', replyto: payload.email, ...payload };
      const res = await fetch(formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean };
      if (!res.ok || json.success === false) throw new Error('send failed');
      status.textContent = '';
      formSuccess(form);
    } catch {
      status.classList.add('is-error');
      status.innerHTML = `Couldn't send that. Try again, or email <a href="mailto:${toEmail}">${toEmail}</a>.`;
    } finally {
      btn.classList.remove('is-loading');
    }
  });
}

/* =======================================================
   16. RESPONSIVE SETUP + BOOT
   ======================================================= */
function initResponsive(seqs: FrameSequence[]): gsap.MatchMedia {
  const mm = gsap.matchMedia();
  mm.add({
    desktop: '(min-width: 768px)',
    mobile: '(max-width: 767px)',
  }, (ctx) => {
    const { mobile } = ctx.conditions as { desktop: boolean; mobile: boolean };
    const cleanups: Cleanup[] = [];
    if (REDUCED) {
      staticScenes(seqs);
    } else {
      cleanups.push(heroScene(seqs[0], { mobile }));
      cleanups.push(missionScene({ mobile }));
      builderScene(seqs[1], { mobile });
      ctaScene(seqs[2], { mobile });
    }
    cleanups.push(initWorkLayout({ mobile }));
    requestAnimationFrame(() => { ScrollTrigger.sort(); ScrollTrigger.refresh(); });
    return () => cleanups.forEach((fn) => { if (typeof fn === 'function') fn(); });
  });
  return mm;
}

/**
 * Starts the whole experience. Call once, after the React markup has mounted.
 * Returns a cleanup function that tears everything down again.
 */
export function initPortfolio(): () => void {
  let disposed = false;
  let mm: gsap.MatchMedia | null = null;
  disposers = [];

  const boot = async (): Promise<void> => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    const address = $('#address');
    if (address) ADDRESS_DEFAULT = (address.textContent ?? '').trim() || ADDRESS_DEFAULT;

    buildStats();
    buildMarquee();
    buildHeroThumbs();
    buildWork();
    buildStrip();
    initImageFallbacks();

    const seqs = createSequences();

    initAnchors();
    initMenu();
    initWorkControls();
    initPreview();
    initLightbox();
    initForm();
    if (FINE_POINTER) initGlow();

    root.classList.add('js');
    ScrollTrigger.config({ ignoreMobileResize: true });

    lenis = initLenis();
    if (lenis) lenis.stop();
    seqs[0].set(0);

    await runPreloader(seqs[0]);
    if (disposed) return;

    mm = initResponsive(seqs);
    initSplits();
    initScrambles();
    initReveals();
    initStats();
    initWordmark();
    initNav();
    initProgress();
    initLoops();
    if (FINE_POINTER && !REDUCED) { initCursor(); initMagnetic(); }

    lazyLoadScenes(seqs);
    void seqs[0].load();

    ScrollTrigger.sort();
    ScrollTrigger.refresh();

    if (REDUCED) finishLoading();
    else exitPreloader();

    if (document.readyState === 'complete') ScrollTrigger.refresh();
    else on(window, 'load', () => ScrollTrigger.refresh());
  };

  void boot();

  return () => {
    disposed = true;
    disposers.forEach((fn) => fn());
    disposers = [];
    if (mm) mm.revert();
    ScrollTrigger.getAll().forEach((st) => st.kill());
    if (lenis) { lenis.destroy(); lenis = null; }
    heroST = null;
    menuOpen = false;
  };
}