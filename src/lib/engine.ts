/* =========================================================
   HARISH MOGER — PORTFOLIO ENGINE
   GSAP 3.13 (ScrollTrigger, SplitText, Draggable, Inertia) + Lenis.

   The three full-screen scenes are canvases scrubbed by scroll:
     hero  — the camera pushes into a laptop screen
     work  — your photo (src/assets/heroimage.jpeg) turns in 3D while
             design dashboards float around it
     cta   — a laptop opens, shows your projects, then closes
   Any scene plays a Higgsfield video instead once its frames exist in
   public/assets/frames/<scene>/ (made by `npm run frames`).
   ========================================================= */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { SITE, SCENES, PROJECTS, SCATTER, type SceneConfig, type SceneVideo, type ResolvedProject } from '../data/siteData';
import { paintLaptopZoom, paintLaptopOpenClose, heroGeometry, type Painter } from './laptop';

gsap.registerPlugin(ScrollTrigger, SplitText, Draggable, InertiaPlugin);

/* =======================================================
   1. HELPERS
   ======================================================= */
const $ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document): T => c.querySelector<T>(s) as T;
const $$ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document): T[] => Array.from(c.querySelectorAll<T>(s));
const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (e0: number, e1: number, x: number): number => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
/** Piecewise-linear lookup through [x, y] points (x ascending). */
const curve = (pts: [number, number][]) => (x: number): number => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    if (x <= x1) { const [x0, y0] = pts[i - 1]; return lerp(y0, y1, (x - x0) / (x1 - x0 || 1)); }
  }
  return pts[pts.length - 1][1];
};
const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const debounce = <A extends unknown[]>(fn: (...a: A) => void, ms = 150) => {
  let t: number | undefined;
  return (...a: A): void => { window.clearTimeout(t); t = window.setTimeout(() => fn(...a), ms); };
};
const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s: unknown): string => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
const isMobile = (): boolean => window.innerWidth < 768;

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const MOBILE_AT_LOAD = isMobile();

let lenis: Lenis | null = null;
let disposers: Array<() => void> = [];

function on<K extends keyof WindowEventMap>(t: Window, type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions): void;
function on<K extends keyof DocumentEventMap>(t: Document, type: K, fn: (e: DocumentEventMap[K]) => void, opts?: AddEventListenerOptions): void;
function on(t: Window | Document, type: string, fn: (e: never) => void, opts?: AddEventListenerOptions): void {
  t.addEventListener(type, fn as EventListener, opts);
  disposers.push(() => t.removeEventListener(type, fn as EventListener, opts));
}

function trapFocus(container: HTMLElement, e: KeyboardEvent): void {
  const els = $$('a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])', container)
    .filter((el) => !el.hidden && el.offsetParent !== null);
  if (!els.length) return;
  const first = els[0], last = els[els.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function scrollToTarget(target: HTMLElement | 0, duration = 1.6): void {
  if (lenis) { lenis.scrollTo(target, { duration }); return; }
  const top = target === 0 ? 0 : target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: REDUCED ? 'auto' : 'smooth' });
}

/* =======================================================
   2. SCROLL SCENE — a canvas scrubbed by scroll
   ======================================================= */
interface ManifestPart { count: number; ext: string }
interface Manifest { desktop?: ManifestPart; mobile?: ManifestPart }

/** Draws `src` so it covers w×h, zoomed by `zoom`, keeping the anchor point (ax, ay) centred where possible. */
function cover(ctx: CanvasRenderingContext2D, src: CanvasImageSource, iw: number, ih: number,
  w: number, h: number, zoom: number, ax: number, ay: number): void {
  const s = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * s, dh = ih * s;
  const dx = clamp(w / 2 - ax * dw, w - dw, 0);
  const dy = clamp(h / 2 - ay * dh, h - dh, 0);
  ctx.drawImage(src, dx, dy, dw, dh);
}

/** A softened copy of the photo: drawn small, then scaled back up by the canvas (cheap blur that works everywhere). */
function soften(img: HTMLImageElement, factor: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(8, Math.round(img.naturalWidth / factor));
  c.height = Math.max(8, Math.round(img.naturalHeight / factor));
  const x = c.getContext('2d') as CanvasRenderingContext2D;
  x.imageSmoothingQuality = 'high';
  x.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

/**
 * Cloudinary serves any moment of a video as an image when the time (so_) is
 * added to its link and the extension is changed to .jpg. Returns a function
 * giving the link for frame i, or null for links that aren't Cloudinary videos.
 */
const CLOUDINARY_VIDEO = /^(.*\/video\/upload\/)(.+?)\.(mp4|mov|webm|m4v)(\?.*)?$/i;
function cloudinaryFrames(v: SceneVideo, mobile: boolean): ((i: number) => string) | null {
  const m = CLOUDINARY_VIDEO.exec(v.url);
  if (!m) return null;
  const [, base, path] = m;
  const n = mobile ? v.frames.mobile : v.frames.desktop;
  const size = mobile ? 'w_608,h_1080,c_fill,g_center' : 'w_1440,c_limit';
  const last = Math.min(v.to, v.duration - 0.05);
  return (i) => {
    const t = v.from + (last - v.from) * (n > 1 ? i / (n - 1) : 0);
    return `${base}so_${t.toFixed(2)},${size},q_auto:eco/${path}.jpg`;
  };
}

class ScrollScene {
  readonly cfg: SceneConfig;
  readonly section: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private photo: CanvasImageSource | null = null;
  private photoW = 0;
  private photoH = 0;
  private frames: Array<HTMLImageElement | undefined> = [];
  private requested = new Set<number>();
  private dir = '';
  private ext = 'webp';
  private count = 0;
  private p = 0;
  private drawn = -1; // exact (fractional) frame position last drawn
  private painter: Painter | null = null;
  /** Where frame i comes from: local files, or Cloudinary for an online video. */
  private src: (i: number) => string = (i) => `${this.dir}/${String(i + 1).padStart(4, '0')}.${this.ext}`;
  private video: HTMLVideoElement | null = null;
  private seeking = false;
  private want = 0;
  /**
   * 'frames' = image sequence (local or Cloudinary) · 'video' = scrubbing a video file
   * 'none' = the scene is built from HTML (the 3D orbit) · 'paint' = drawn laptop · 'photo'
   */
  mode: 'photo' | 'paint' | 'frames' | 'video' | 'none' = 'paint';

  constructor(cfg: SceneConfig) {
    this.cfg = cfg;
    if (cfg.art === 'laptop-zoom') this.painter = paintLaptopZoom;
    else if (cfg.art === 'laptop-open-close') this.painter = paintLaptopOpenClose(PROJECTS.map((p) => p.color));
    this.section = $(cfg.section);
    this.canvas = $<HTMLCanvasElement>(cfg.canvas);
    this.ctx = this.canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
    this.resize();
    on(window, 'resize', debounce(() => { this.resize(); this.render(true); }, 150));
  }

  private prepared: Promise<void> | null = null;

  /** Uses Higgsfield frames if `npm run frames` has made them, otherwise the photo. Safe to call repeatedly. */
  prepare(): Promise<void> {
    if (!this.prepared) this.prepared = this.detect();
    return this.prepared;
  }

  private async detect(): Promise<void> {
    if (this.cfg.video) {
      await this.detectVideo(this.cfg.video);
      this.render(true);
      return;
    }
    try {
      const res = await fetch(`${this.cfg.frames}/manifest.json`, { cache: 'no-cache' });
      if (res.ok) {
        const m = (await res.json()) as Manifest;
        const useMobile = MOBILE_AT_LOAD && !!m.mobile?.count;
        const part = useMobile ? m.mobile : m.desktop ?? m.mobile;
        if (part && part.count > 0) {
          this.count = part.count;
          this.ext = part.ext || 'webp';
          this.dir = `${this.cfg.frames}/${useMobile || !m.desktop ? 'mobile' : 'desktop'}`;
          this.frames = new Array(part.count);
        }
      }
    } catch { /* no manifest (the dev server answers with HTML): fall back to the photo */ }

    if (this.count && (await this.loadFrame(0))) {
      this.mode = 'frames';
      this.section.classList.add('has-frames');
    } else if (this.cfg.art === 'photo') {
      this.mode = 'photo';
      await this.loadPhoto();
    } else if (this.cfg.art === 'photo-orbit') {
      this.mode = 'none';
    } else {
      this.mode = 'paint';
    }
    this.render(true);
  }

  private loadPhoto(): Promise<void> {
    const { photo, motion } = this.cfg;
    if (!photo || !motion) return Promise.resolve();
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        this.photoW = img.naturalWidth;
        this.photoH = img.naturalHeight;
        this.photo = motion.soften > 1 ? soften(img, motion.soften) : img;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = photo;
    });
  }

  /** An online video: Cloudinary frames when possible (smooth), otherwise the video file itself. */
  private async detectVideo(v: SceneVideo): Promise<void> {
    this.section.classList.add('has-video');
    const frameAt = cloudinaryFrames(v, MOBILE_AT_LOAD);
    if (frameAt) {
      this.src = frameAt;
      this.count = MOBILE_AT_LOAD ? v.frames.mobile : v.frames.desktop;
      this.frames = new Array(this.count);
      // Cloudinary makes each frame the first time it is asked for, so allow a moment.
      if (await Promise.race([this.loadFrame(0), wait(15000).then(() => false)])) {
        this.mode = 'frames';
        return;
      }
      this.count = 0;
      this.frames = [];
      this.requested.clear();
    }
    await this.loadVideo(v);
    // Neither worked (offline, blocked…): fall back to the scene's own art
    // (drawn laptop or your photo) rather than a black screen.
    if (this.mode !== 'video') {
      if (this.painter) {
        this.mode = 'paint';
        this.section.classList.remove('has-video');
      } else {
        this.mode = 'photo';
        await this.loadPhoto();
      }
    }
  }

  private loadVideo(v: SceneVideo): Promise<void> {
    return new Promise((resolve) => {
      const el = document.createElement('video');
      let settled = false;
      const done = (ok: boolean): void => {
        if (settled) return;
        settled = true;
        if (ok) {
          this.video = el;
          this.mode = 'video';
          el.addEventListener('seeked', () => this.onSeeked());
        } else {
          this.mode = 'none';
        }
        resolve();
      };
      el.muted = true;
      el.playsInline = true;
      el.preload = 'auto';
      el.addEventListener('loadeddata', () => done(true), { once: true });
      el.addEventListener('error', () => done(false), { once: true });
      window.setTimeout(() => done(false), 20000);
      el.src = v.url;
      el.load();
    });
  }

  private onSeeked(): void {
    this.seeking = false;
    this.drawVideo();
    const el = this.video;
    if (el && Math.abs(el.currentTime - this.want) > 0.03) { this.seeking = true; el.currentTime = this.want; }
  }

  private drawVideo(): void {
    const el = this.video;
    if (!el || el.readyState < 2) return;
    const { width: w, height: h } = this.canvas;
    const box = this.frameBox(el.videoWidth, el.videoHeight, w, h);
    this.drawBox(el, box, w, h);
    this.fadeEdges(box, w, h);
  }

  /**
   * Where a video frame goes. Normally it covers the screen. With `inset`
   * (siteData), it starts smaller, centred just below the nav, and grows to
   * cover the screen from `fillFrom` onward.
   */
  private frameBox(iw: number, ih: number, w: number, h: number): { x: number; y: number; w: number; h: number; full: boolean } {
    const fill = Math.max(w / iw, h / ih);
    const inset = this.cfg.video?.inset;
    if (!inset) return { x: (w - iw * fill) / 2, y: (h - ih * fill) / 2, w: iw * fill, h: ih * fill, full: true };
    const small = Math.min((h * inset.height) / ih, (w * 0.96) / iw);
    const grow = easeInOut(clamp((this.p - (inset.fillFrom ?? 1)) / (1 - (inset.fillFrom ?? 1) || 1), 0, 1));
    const k = lerp(small, fill, grow);
    const cy = lerp(h * 0.54, h * 0.5, grow); // a little low at first, clear of the nav
    return { x: (w - iw * k) / 2, y: cy - (ih * k) / 2, w: iw * k, h: ih * k, full: grow >= 1 };
  }

  private drawBox(src: CanvasImageSource, box: { x: number; y: number; w: number; h: number; full: boolean }, w: number, h: number): void {
    if (!box.full) { this.ctx.fillStyle = '#07060B'; this.ctx.fillRect(0, 0, w, h); }
    this.ctx.drawImage(src, box.x, box.y, box.w, box.h);
  }

  /** Soft edges, so a smaller video melts into the dark page instead of showing its rectangle. */
  private fadeEdges(box: { x: number; y: number; w: number; h: number; full: boolean }, w: number, h: number): void {
    if (box.full) return;
    const { ctx } = this;
    const f = Math.min(box.w, box.h) * 0.14;
    const bg = 'rgba(7,6,11,1)', clear = 'rgba(7,6,11,0)';
    const edge = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number): void => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, bg); g.addColorStop(1, clear);
      ctx.fillStyle = g; ctx.fillRect(rx, ry, rw, rh);
    };
    edge(box.x, 0, box.x + f, 0, box.x - 1, 0, f + 1, h);                         // left
    edge(box.x + box.w, 0, box.x + box.w - f, 0, box.x + box.w - f, 0, f + 1, h); // right
    edge(0, box.y, 0, box.y + f, 0, box.y - 1, w, f + 1);                         // top
    edge(0, box.y + box.h, 0, box.y + box.h - f, 0, box.y + box.h - f, w, f + 1); // bottom
  }

  private loadFrame(i: number): Promise<boolean> {
    this.requested.add(i);
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { this.frames[i] = img; resolve(true); };
      img.onerror = () => resolve(false);
      img.src = this.src(i);
    });
  }

  /** Loads frames coarse-to-fine (every 8th, then 4th, 2nd, 1st) so scrubbing works early. */
  async loadFrames(limit = Infinity, onProgress?: (f: number) => void): Promise<void> {
    await this.prepare();
    if (this.mode !== 'frames') { onProgress?.(1); return; }
    const seen = new Set<number>();
    const order: number[] = [];
    for (const step of [8, 4, 2, 1]) {
      for (let i = 0; i < this.count; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
    }
    const queue = order.filter((i) => !this.requested.has(i)).slice(0, limit);
    const total = queue.length || 1;
    let done = 0;
    const worker = async (): Promise<void> => {
      while (queue.length) {
        const i = queue.shift() as number;
        await this.loadFrame(i);
        done++;
        onProgress?.(done / total);
        if (Math.abs(i - this.target()) < 3) this.render(true);
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
    onProgress?.(1);
    this.render(true);
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile() ? 1.5 : 2);
    this.canvas.width = Math.round((this.canvas.clientWidth || window.innerWidth) * dpr);
    this.canvas.height = Math.round((this.canvas.clientHeight || window.innerHeight) * dpr);
  }

  private target(): number { return Math.round(this.p * (this.count - 1)); }

  private nearest(i: number): HTMLImageElement | null {
    for (let d = 1; d < this.count; d++) {
      const a = this.frames[i - d]; if (a) return a;
      const b = this.frames[i + d]; if (b) return b;
    }
    return null;
  }

  set(p: number): void {
    // A video can play over only part of the scroll, then hold its last frame.
    const next = clamp(p / (this.cfg.video?.scrollShare ?? 1), 0, 1);
    if (next === this.p && this.mode !== 'frames' && this.mode !== 'video') return;
    this.p = next;
    this.render();
  }

  render(force = false): void {
    const { ctx } = this;
    const { width: w, height: h } = this.canvas;

    if (this.mode === 'none') return;
    if (this.mode === 'video' && this.video && this.cfg.video) {
      const v = this.cfg.video;
      const end = Math.min(v.to, this.video.duration || v.to);
      this.want = v.from + (end - v.from) * this.p;
      if (!this.seeking && Math.abs(this.video.currentTime - this.want) > 0.03) {
        this.seeking = true;
        this.video.currentTime = this.want;
      } else if (force) {
        this.drawVideo();
      }
      return;
    }
    if (this.mode === 'paint' && this.painter) {
      this.painter(ctx, w, h, this.p);
      return;
    }

    if (this.mode === 'frames') {
      // Between two frames, blend them so the motion stays smooth however slowly you scroll.
      const f = this.p * (this.count - 1);
      if (Math.abs(f - this.drawn) < 0.01 && !force) return;
      const i = Math.floor(f), t = f - i;
      const a = this.frames[i] || this.nearest(i);
      if (!a) return;
      const box = this.frameBox(a.naturalWidth, a.naturalHeight, w, h);
      this.drawBox(a, box, w, h);
      const b = this.frames[i] && t > 0.02 ? this.frames[i + 1] : undefined;
      if (b) {
        ctx.globalAlpha = t;
        ctx.drawImage(b, box.x, box.y, box.w, box.h);
        ctx.globalAlpha = 1;
      }
      this.fadeEdges(box, w, h);
      this.drawn = this.frames[i] ? f : -1;
      return;
    }

    if (!this.photo || !this.cfg.motion) { ctx.fillStyle = '#07060B'; ctx.fillRect(0, 0, w, h); return; }
    // Photo: pull back, then push in on the focus point, with a slow drift.
    const { zoom: [z0, z1, z2], focus, drift } = this.cfg.motion;
    const p = this.p;
    const z = p < 0.5 ? lerp(z0, z1, easeInOut(p / 0.5)) : lerp(z1, z2, easeInOut((p - 0.5) / 0.5));
    cover(ctx, this.photo, this.photoW, this.photoH, w, h, z, focus.x, focus.y + (p - 0.5) * drift);
  }
}

/* =======================================================
   3. LOADING
   ======================================================= */
function initLenis(): Lenis | null {
  if (REDUCED) return null;
  const l = new Lenis({
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  l.on('scroll', ScrollTrigger.update);
  const raf = (time: number): void => l.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  disposers.push(() => { gsap.ticker.remove(raf); l.destroy(); });
  return l;
}

async function runPreloader(hero: ScrollScene): Promise<void> {
  const out = $('#preCount');
  let target = 6, shown = 0;
  const tick = (): void => {
    shown += (target - shown) * 0.12;
    if (out) out.textContent = String(Math.min(100, Math.round(shown)));
  };
  gsap.ticker.add(tick);
  const fonts = (document.fonts?.ready ?? Promise.resolve()).then(() => { target = Math.max(target, 30); });
  const scene = hero.prepare().then(() => { target = Math.max(target, 45); })
    .then(() => hero.loadFrames(32, (f) => { target = Math.max(target, 45 + f * 55); }));
  await Promise.race([Promise.all([fonts, scene, wait(1100)]), wait(4500)]);
  target = 100;
  await wait(420);
  gsap.ticker.remove(tick);
  if (out) out.textContent = '100';
}

function revealSite(): Promise<void> {
  return new Promise((resolve) => {
    const done = (): void => {
      document.body.classList.remove('is-loading');
      $('#preloader').style.display = 'none';
      ScrollTrigger.refresh();
      lenis?.start();
      resolve();
    };
    if (REDUCED) { done(); return; }
    gsap.timeline({ onComplete: done })
      .to('.preloader__count, .preloader__mark', { autoAlpha: 0, y: -14, duration: 0.4, ease: 'power2.in', stagger: 0.05 })
      .to('#preloader', { clipPath: 'inset(0 0 100% 0)', duration: 1.05, ease: 'power4.inOut' }, '-=0.05')
      .from('#heroCanvas', { autoAlpha: 0, duration: 1.4, ease: 'power2.out' }, '<0.2')
      .from('.hero__title .mask__in', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.1 }, '<0.2')
      .from('.hero [data-intro]', { autoAlpha: 0, y: 16, duration: 0.8, ease: 'power3.out', stagger: 0.07 }, '<0.35')
      .from('.hero__cue', { autoAlpha: 0, duration: 0.8 }, '<0.2');
  });
}

/* =======================================================
   4. PINNED SCENES
   ======================================================= */
function pinScene(
  scene: ScrollScene, mobile: boolean,
  onUpdate?: (self: ScrollTrigger) => void,
  onProgress?: (p: number) => void,
): gsap.core.Timeline {
  const proxy = { p: 0 };
  const { length, videoLength } = scene.cfg;
  const filmed = !!scene.cfg.video || scene.mode === 'frames';
  const len = filmed && videoLength ? videoLength : length;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: scene.section, start: 'top top',
      end: `+=${mobile ? len.mobile : len.desktop}%`,
      pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true, onUpdate,
    },
  });
  tl.to(proxy, { p: 1, duration: 1, onUpdate: () => { scene.set(proxy.p); onProgress?.(proxy.p); } }, 0);
  scene.set(0);
  onProgress?.(0);
  return tl;
}

/** Hero: the text stays put while the camera pushes into the laptop. The nav arrives once the screen fills the view. */
/**
 * Hero. Opens on the closed laptop, small on the horizon. As you scroll, the
 * camera moves in while the lid opens, and the text lines appear inside the
 * screen one after another (eyebrow, both headline lines, the sentence, the
 * buttons). Then the camera pushes into the screen and the text grows with it
 * until the screen fills the view; the nav arrives at the end.
 * With SITE.heroTextAtStart, the text starts above the closed laptop instead
 * and drops into the screen. Returns a cleanup function.
 */
function heroScene(scene: ScrollScene, mobile: boolean): () => void {
  const nav = $('#nav');
  const copy = $('.hero__copy', scene.section);
  const lines = $$('.hero__line', copy);
  const cue = $('.hero__cue', scene.section);
  const textFirst = SITE.heroTextAtStart;
  let last = 0;
  let top = 0, bottom = 0; // the text block's extent, untransformed

  // Each line scales about the centre of the view, so the whole block maps
  // onto the screen as one picture. offsetLeft/Top ignore transforms.
  const measure = (): void => {
    const W = copy.clientWidth, H = copy.clientHeight;
    top = Infinity; bottom = -Infinity;
    lines.forEach((el) => {
      let x = 0, y = 0;
      for (let n: HTMLElement | null = el; n && n !== copy; n = n.offsetParent as HTMLElement | null) { x += n.offsetLeft; y += n.offsetTop; }
      el.style.transformOrigin = `${W / 2 - x}px ${H / 2 - y}px`;
      top = Math.min(top, y); bottom = Math.max(bottom, y + el.offsetHeight);
    });
  };

  const place = (p: number): void => {
    last = p;
    const W = copy.clientWidth, H = copy.clientHeight;
    const { screen } = heroGeometry(W, H, p);
    const pad = 0.08; // keep the text off the screen's edges
    const k = Math.min(1, (screen.w * (1 - pad * 2)) / W, (screen.h * (1 - pad * 2)) / H);
    const tx = screen.x + screen.w / 2 - W / 2;
    const ty = screen.y + screen.h / 2 - H / 2;
    if (textFirst) {
      // Start: the block sits above the horizon, shrunk if needed to fit.
      const target = heroGeometry(W, H, 0).horizon - H * 0.05, roof = H * 0.06;
      const s0 = Math.min(1, (target - roof) / Math.max(1, bottom - top));
      const lift = target - (H / 2 + (bottom - H / 2) * s0);
      lines.forEach((el, i) => {
        const t = easeInOut(clamp((p - (0.12 + i * 0.025)) / 0.18, 0, 1)); // one after another
        el.style.transform = `translate(${(tx * t).toFixed(2)}px, ${lerp(lift, ty, t).toFixed(2)}px) scale(${lerp(s0, k, t).toFixed(4)})`;
        el.style.opacity = '1';
      });
    } else {
      // Each line appears inside the screen in turn, rising a little as it fades in.
      lines.forEach((el, i) => {
        const t = easeInOut(clamp((p - (0.2 + i * 0.03)) / 0.1, 0, 1));
        el.style.transform = `translate(${tx.toFixed(2)}px, ${(ty + (1 - t) * 28 * k).toFixed(2)}px) scale(${k.toFixed(4)})`;
        el.style.opacity = t.toFixed(3);
      });
    }
    cue.style.opacity = (1 - clamp(p / 0.05, 0, 1)).toFixed(3);
    nav.classList.toggle('is-in', p > 0.84);
  };

  measure();
  pinScene(scene, mobile, undefined, place);
  const onRefresh = (): void => { measure(); place(last); };
  ScrollTrigger.addEventListener('refresh', onRefresh);
  return () => {
    ScrollTrigger.removeEventListener('refresh', onRefresh);
    lines.forEach((el) => { el.style.transform = ''; el.style.transformOrigin = ''; el.style.opacity = ''; });
    cue.style.opacity = '';
  };
}

/**
 * Closing scene with your video (siteData `video` on the cta scene), staged
 * like the reference: over the first part of the scroll you lift the laptop,
 * open it and push it toward the camera until the screen fills the view, and
 * the caption fades in as the laptop opens. Then the full screen blurs and
 * brightens to a near-white glow, drops to grey with dark edges while the
 * caption fades, and the scene goes dark before the contact section.
 */
function ctaVideoScene(scene: ScrollScene, mobile: boolean): void {
  const s = scene.section;
  const screen = $('.scene__canvas', s);
  const words = $$('.scene__caption > *', s);
  const end = scene.cfg.video?.scrollShare ?? 0.66; // where the video reaches its last frame
  pinScene(scene, mobile)
    .fromTo(words, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.12, stagger: 0.04, ease: 'power2.out' }, 0.3)
    .fromTo(screen,
      { filter: 'blur(0px) brightness(1) saturate(1)' },
      { filter: 'blur(30px) brightness(2.6) saturate(0.55)', duration: 0.13, ease: 'power1.in' }, end)
    .to(screen, { filter: 'blur(34px) brightness(0.62) saturate(0)', duration: 0.1, ease: 'power1.inOut' }, end + 0.14)
    .fromTo($('.scene__shade', s), { opacity: 0 }, { opacity: 1, duration: 0.1 }, end + 0.14)
    .to(words, { autoAlpha: 0, duration: 0.08 }, end + 0.18)
    .to($('.scene__fade', s), { opacity: 1, duration: 0.08 }, 0.92);
}

function captionScene(scene: ScrollScene, mobile: boolean): void {
  const tl = pinScene(scene, mobile);
  const s = scene.section;
  const parts = $$('.scene__caption > *', s);
  tl.fromTo($('.scene__fade', s), { opacity: 1 }, { opacity: 0, duration: 0.12 }, 0)
    .fromTo(parts, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.14, stagger: 0.05, ease: 'power2.out' }, 0.1)
    .to(parts, { autoAlpha: 0, y: -60, duration: 0.12, stagger: 0.04, ease: 'power2.in' }, 0.7)
    .to($('.scene__fade', s), { opacity: 1, duration: 0.14 }, 0.86);
}

/**
 * Second section: the world (your photo + dashboards) turns in 3D as you scroll,
 * the dashboards arrive one by one, the Projects board slides in front, then
 * the caption shows and the scene fades out.
 */
/**
 * Second section with your online 360° video (siteData `video`). The video
 * plays clear across the pin. The six app windows each travel a full circle
 * around you in step with the camera (the angle measured from your video), so
 * they sweep round with the room: bigger as they pass the camera's side,
 * smaller round the back. A window fades out only while it would cover you,
 * and turns a little to face the camera so it never shows its back. As the
 * camera comes back to the front, the gallery and launches dashboards swing in
 * behind the caption while the small windows dim. Then the scene fades out.
 */
function orbitVideoScene(scene: ScrollScene, mobile: boolean): void {
  const s = scene.section;
  const v = scene.cfg.video as SceneVideo;
  const wins = $$('.panel:not(.panel--late)', s).filter((el) => getComputedStyle(el).display !== 'none');
  const faces = wins.map((el) => $('.panel__in', el));
  const words = $$('.scene__caption > *', s);
  const turnAt = curve(v.turn ?? [[v.from, 0], [v.to, 360]]);
  const u = (): number => (mobile
    ? Math.min(window.innerWidth * 0.022, window.innerHeight * 0.014)
    : Math.min(window.innerWidth * 0.01, window.innerHeight * 0.018));
  // In --u units: the circle's size, the scene's depth, and the perspective set in styles.css.
  const R = mobile ? { x: 16, z: 14 } : { x: 40, z: 30 };
  const DEPTH = -10;
  const PERSPECTIVE = 110;
  // Where each window starts on its circle (--a), its height (--y) and width (--w), from styles.css.
  const spots = wins.map((el) => {
    const cs = getComputedStyle(el);
    const num = (name: string, d: number): number => { const n = parseFloat(cs.getPropertyValue(name)); return Number.isFinite(n) ? n : d; };
    return { a: num('--a', 0), y: num('--y', 0), w: num('--w', 10) };
  });
  gsap.set($('.orbit__world', s), { rotationY: 0, z: 0 });

  const place = (p: number): void => {
    const U = u();
    // Negative, so windows behind you travel the same way as the room in the video.
    const turn = -turnAt(v.from + (v.to - v.from) * p);
    const dim = 1 - 0.62 * smooth(0.64, 0.72, p);
    wins.forEach((el, i) => {
      const { a, y, w } = spots[i];
      const ang = ((((a + turn) % 360) + 540) % 360) - 180; // -180…180, 0 = between you and the camera
      const r = (ang * Math.PI) / 180;
      const x = R.x * Math.sin(r), z = R.z * Math.cos(r) + DEPTH;
      // Fade while the window would sit over you (head is narrower than shoulders).
      const k = PERSPECTIVE / (PERSPECTIVE - z);
      const gap = Math.abs(x) * k - (w / 2) * k - (y < -14 ? 8 : 15);
      const overYou = mobile && Math.abs(y) > 28 ? false : true;
      const clear = overYou ? smooth(0, 5, gap) : 1;
      el.style.transform = `translate(-50%, -50%) translate3d(${(x * U).toFixed(1)}px, ${(y * U).toFixed(1)}px, ${(z * U).toFixed(1)}px) rotateY(${(-ang * 0.35).toFixed(2)}deg)`;
      faces[i].style.opacity = (clear * dim).toFixed(3);
    });
  };

  pinScene(scene, mobile, undefined, place)
    .fromTo($('.p-gallery > .panel__in', s),
      { autoAlpha: 0, x: () => u() * 14, rotationY: 40 },
      { autoAlpha: 1, x: 0, rotationY: 0, duration: 0.14, ease: 'power2.out' }, 0.64)
    .fromTo($('.p-cards > .panel__in', s),
      { autoAlpha: 0, x: () => -u() * 10, rotationY: -34 },
      { autoAlpha: 1, x: 0, rotationY: 0, duration: 0.14, ease: 'power2.out' }, 0.69)
    .fromTo(words, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.1, stagger: 0.04, ease: 'power2.out' }, 0.72)
    .to(words, { autoAlpha: 0, y: -50, duration: 0.07, stagger: 0.03, ease: 'power2.in' }, 0.9)
    .to($('.scene__fade', s), { opacity: 1, duration: 0.06 }, 0.93);
}

function orbitScene(scene: ScrollScene, mobile: boolean): void {
  const s = scene.section;
  if (scene.cfg.video) { orbitVideoScene(scene, mobile); return; }
  if (scene.mode === 'frames') {
    // A Higgsfield 360° orbit plays across the whole pin (the 3D photo and
    // dashboards are hidden by CSS); the caption lands as the camera comes
    // back round to face you.
    const fade = $('.scene__fade', s);
    const words = $$('.scene__caption > *', s);
    pinScene(scene, mobile)
      .fromTo(fade, { opacity: 1 }, { opacity: 0, duration: 0.06 }, 0)
      .fromTo($('.scene__shade', s), { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0.72)
      .fromTo(words, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.1, stagger: 0.04, ease: 'power2.out' }, 0.74)
      .to(words, { autoAlpha: 0, y: -50, duration: 0.08, stagger: 0.03, ease: 'power2.in' }, 0.9)
      .to(fade, { opacity: 1, duration: 0.06 }, 0.94);
    return;
  }
  const world = $('.orbit__world', s);
  const panels = $$('.panel:not(.panel--late) > .panel__in', s);
  const board = $$('.panel--late > .panel__in', s);
  const parts = $$('.scene__caption > *', s);
  // Same unit as --u in styles.css, so depths scale with the screen.
  const u = (): number => (mobile
    ? Math.min(window.innerWidth * 0.022, window.innerHeight * 0.014)
    : Math.min(window.innerWidth * 0.01, window.innerHeight * 0.018));

  // Size the photo plane to the photo's own proportions.
  const img = $<HTMLImageElement>('.orbit__photo img', s);
  const fit = (): void => { if (img.naturalWidth) $('.orbit__photo', s).style.setProperty('--ar', String(img.naturalWidth / img.naturalHeight)); };
  if (img.complete) fit(); else img.addEventListener('load', fit, { once: true });

  // The world turns around its origin, where the photo sits, like a camera
  // circling you; pulling it back (negative z) leaves room for the panels in front.
  pinScene(scene, mobile)
    .fromTo($('.scene__fade', s), { opacity: 1 }, { opacity: 0, duration: 0.08 }, 0)
    .fromTo(world,
      { rotationY: mobile ? 18 : 28, rotationX: 5, z: () => -u() * 54 },
      { rotationY: mobile ? -8 : -14, rotationX: 0, z: () => -u() * 36, duration: 0.9, ease: 'sine.inOut' }, 0)
    .fromTo(img, { scale: 1.08 }, { scale: 1, duration: 0.9 }, 0)
    .fromTo(panels,
      { autoAlpha: 0, z: () => -u() * 18, scale: 0.88 },
      { autoAlpha: 1, z: 0, scale: 1, duration: 0.16, stagger: 0.045, ease: 'power2.out' }, 0.04)
    .to(panels, { rotationY: (i: number) => (i % 2 ? 10 : -10), duration: 0.85 }, 0.05)
    .fromTo(board,
      { autoAlpha: 0, z: () => -u() * 30, rotationY: 26 },
      { autoAlpha: 1, z: 0, rotationY: 0, duration: 0.2, ease: 'power2.out' }, 0.44)
    .fromTo($('.scene__shade', s), { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.58)
    .fromTo(parts, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.12, stagger: 0.05, ease: 'power2.out' }, 0.6)
    .to(parts, { autoAlpha: 0, y: -50, duration: 0.1, stagger: 0.03, ease: 'power2.in' }, 0.84)
    .to($('.scene__fade', s), { opacity: 1, duration: 0.1 }, 0.9);
}

function staticScenes(scenes: ScrollScene[]): void {
  scenes.forEach((s, i) => s.set(i === 0 ? 1 : i === 2 ? 0.5 : 0.15)); // hero: screen fills the view; closing laptop: open
  gsap.set('.orbit__world', { rotationY: -6, z: -45 * Math.min(window.innerWidth * 0.01, window.innerHeight * 0.018) });
  const img = document.querySelector<HTMLImageElement>('.orbit__photo img');
  const fit = (): void => { if (img?.naturalWidth) img.parentElement?.style.setProperty('--ar', String(img.naturalWidth / img.naturalHeight)); };
  if (img?.complete) fit(); else img?.addEventListener('load', fit, { once: true });
  $('#nav').classList.add('is-in');
}

/* =======================================================
   5. SECTION MOTION
   ======================================================= */
function initStats(): void {
  if (REDUCED) return;
  const vals = $$('.stat__value');
  vals.forEach((v) => { v.textContent = '0'; });
  ScrollTrigger.create({
    trigger: '.stats', start: 'top 80%', once: true,
    onEnter: () => {
      vals.forEach((v, i) => {
        const o = { n: 0 };
        const target = Number(v.dataset.count);
        const places = Number.isInteger(target) ? 0 : 1; // 3.5 counts up as 0.0 … 3.5
        gsap.to(o, { n: target, duration: 1.6, delay: i * 0.1, ease: 'power3.out',
          onUpdate: () => { v.textContent = o.n.toFixed(places); },
          onComplete: () => { v.textContent = String(target); } });
      });
      gsap.from('.stat', { y: 30, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.08 });
    },
  });
}

function missionScene(mobile: boolean): () => void {
  const el = $('[data-fill]');
  const split = SplitText.create(el, { type: 'words', wordsClass: 'fill-word' });
  const words = split.words as HTMLElement[];
  gsap.set(words, { opacity: 0.16 });
  gsap.timeline({
    scrollTrigger: {
      trigger: '#mission', start: 'top top', end: `+=${mobile ? 110 : 140}%`,
      pin: true, scrub: 0.6, anticipatePin: 1,
    },
  }).to(words, { opacity: 1, ease: 'none', stagger: 0.1, duration: 0.4 });
  return () => split.revert();
}

function initReveals(): void {
  if (REDUCED) return;
  [['.work__head > *', '.work__head'], ['.contact__inner > *', '.contact'], ['#motion .showcase__head > *', '#motion'], ['.showcase--reels .showcase__head > *', '.showcase--reels']].forEach(([items, trigger]) => {
    gsap.from(items, {
      y: 40, autoAlpha: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07,
      scrollTrigger: { trigger, start: 'top 78%', once: true },
    });
  });
}

function initNav(heroEnd: () => number): void {
  const nav = $('#nav');
  const bar = $('.progress span');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      nav.classList.toggle('is-solid', self.scroll() > heroEnd() - 4);
      bar.style.transform = `scaleX(${self.progress.toFixed(4)})`;
    },
  });
}

/** A ring that trails the pointer and grows over anything clickable (mouse only). */
function initCursor(): void {
  if (!FINE_POINTER || REDUCED) return;
  const ring = $('.cursor');
  document.documentElement.classList.add('has-cursor');
  gsap.set(ring, { xPercent: -50, yPercent: -50, x: -100, y: -100 });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3' });
  on(window, 'pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    rx(e.clientX); ry(e.clientY);
    ring.classList.add('is-on');
  }, { passive: true });
  on(document, 'pointerover', (e) => {
    const t = e.target as HTMLElement;
    ring.classList.toggle('is-link', !!t.closest?.('a, button, label, input, textarea, .card, .prism-carousel__card, .depth-carousel__card'));
  });
  on(document, 'mouseleave', () => ring.classList.remove('is-on'));
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
    scrollToTarget(target);
  });
  $('#toTop').addEventListener('click', () => scrollToTarget(0, 2.2));
}

/* =======================================================
   6. WORK PILE — grab, throw, open
   ======================================================= */
const PILE: { drags: Draggable[]; dragging: boolean } = { drags: [], dragging: false };

function buildWork(): void {
  const pile = $('#workPile');
  pile.innerHTML = PROJECTS.map((p, i) => `
    <button class="card" type="button" data-index="${i}" aria-label="Open project: ${esc(p.name)}">
      <span class="card__shot" style="--c:${p.color}"><img src="${p.thumb}" alt="" loading="lazy" decoding="async" draggable="false"><b aria-hidden="true">${esc(p.name)}</b></span>
      <span class="card__name">${esc(p.name)}</span>
    </button>`).join('');
  $$<HTMLImageElement>('.card__shot img', pile).forEach((img) => {
    const fail = (): void => { img.parentElement?.classList.add('is-empty'); img.remove(); };
    if (img.complete && img.naturalWidth === 0) fail(); else img.addEventListener('error', fail, { once: true });
  });
  pile.addEventListener('click', (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('.card');
    if (card && !PILE.dragging) openModal(Number(card.dataset.index), card);
  });
}

function layoutPile(): void {
  const pile = $('#workPile');
  const cards = $$('.card', pile);
  const cw = pile.clientWidth, ch = pile.clientHeight;
  if (!cw || !cards.length) return;
  const w = cards[0].offsetWidth, h = cards[0].offsetHeight;
  cards.forEach((c, i) => {
    const [nx, ny, r] = SCATTER[i % SCATTER.length];
    c.dataset.rot = String(r);
    gsap.set(c, { x: nx * (cw - w), y: ny * (ch - h), rotation: r });
  });
  PILE.drags.forEach((d) => d.update());
}

function initPile(mobile: boolean): () => void {
  const pile = $('#workPile');
  const cards = $$('.card', pile);
  if (mobile || REDUCED) {
    gsap.set(cards, { clearProps: 'transform' });
    return () => {};
  }
  layoutPile();
  let lastX = 0;
  PILE.drags = Draggable.create(cards, {
    type: 'x,y', bounds: pile, inertia: true, edgeResistance: 0.85, zIndexBoost: true,
    minimumMovement: 6, dragClickables: true,
    onPress() { lastX = this.x; },
    onDragStart() { PILE.dragging = true; (this.target as HTMLElement).classList.add('is-dragging'); },
    onDrag() { tilt(this as unknown as Draggable); },
    onThrowUpdate() { tilt(this as unknown as Draggable); },
    onRelease() {
      (this.target as HTMLElement).classList.remove('is-dragging');
      window.setTimeout(() => { PILE.dragging = false; }, 0);
      if (!this.isThrowing) settle(this.target);
    },
    onThrowComplete() { settle(this.target); },
  });
  function tilt(d: Draggable): void {
    const vx = d.x - lastX; lastX = d.x;
    gsap.to(d.target, { rotation: clamp(vx * 1.4, -14, 14), duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
  }
  function settle(t: Element): void {
    gsap.to(t, { rotation: Number((t as HTMLElement).dataset.rot) || 0, duration: 1.1, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' });
  }
  // Cards drop into the window the first time it scrolls into view.
  gsap.from(cards, {
    y: '-=320', autoAlpha: 0, duration: 1.1, ease: 'back.out(1.5)', stagger: 0.05,
    scrollTrigger: { trigger: pile, start: 'top 75%', once: true },
  });
  const onResize = debounce(layoutPile, 200);
  window.addEventListener('resize', onResize);
  return () => {
    window.removeEventListener('resize', onResize);
    PILE.drags.forEach((d) => d.kill());
    PILE.drags = [];
  };
}

/* =======================================================
   7. PROJECT MODAL
   ======================================================= */
const MODAL: { index: number; origin: HTMLElement | null } = { index: 0, origin: null };
/** Re-checks how the popup's image should sit, once the popup has a size. */
let refitShot: () => void = () => {};

function fillModal(p: ResolvedProject): void {
  $('#mCat').textContent = p.category;
  $('#mTitle').textContent = p.name;
  $('#mSummary').textContent = p.summary;
  $('#mTags').innerHTML = p.deliverables.map((d) => `<li>${esc(d)}</li>`).join('');
  const visit = $<HTMLAnchorElement>('#mVisit');
  visit.href = p.url;
  visit.setAttribute('aria-label', `Open ${p.name} (new tab)`);
  const view = $('#mView');
  view.scrollTop = 0;
  view.innerHTML = '';
  view.classList.remove('is-short');
  const img = new Image();
  img.className = 'modal__shot';
  img.alt = `Screenshot of ${p.name}`;
  img.decoding = 'async';
  // A tall full-page screenshot scrolls; a shorter image (like a 16:9 hero) shows
  // whole and centred, over a blurred, darkened copy of itself.
  const fit = (): void => {
    if (!img.naturalWidth || !view.clientWidth) return; // not loaded, or the popup isn't showing yet
    const short = img.naturalHeight / img.naturalWidth < view.clientHeight / view.clientWidth;
    view.classList.toggle('is-short', short);
    if (short) view.style.setProperty('--shot', `url("${p.full}")`);
  };
  refitShot = fit;
  img.onload = fit;
  img.onerror = () => { view.innerHTML = `<div class="modal__empty" style="--c:${p.color}"><span>${esc(p.name)}</span></div>`; };
  img.src = p.full;
  view.appendChild(img);
  $('#address').textContent = p.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function modalKeys(e: KeyboardEvent): void {
  if (e.key === 'Escape') closeModal();
  else if (e.key === 'ArrowRight') stepModal(1);
  else if (e.key === 'ArrowLeft') stepModal(-1);
  else if (e.key === 'Tab') trapFocus($('.modal__panel'), e);
}

function stepModal(d: number): void {
  MODAL.index = (MODAL.index + d + PROJECTS.length) % PROJECTS.length;
  const parts = [$('#mView'), $('.modal__info')];
  if (REDUCED) { fillModal(PROJECTS[MODAL.index]); return; }
  gsap.to(parts, { autoAlpha: 0, duration: 0.18, onComplete: () => {
    fillModal(PROJECTS[MODAL.index]);
    gsap.to(parts, { autoAlpha: 1, duration: 0.3 });
  } });
}

function openModal(i: number, origin: HTMLElement): void {
  const modal = $('#modal');
  const panel = $('.modal__panel', modal);
  MODAL.index = i;
  MODAL.origin = origin;
  fillModal(PROJECTS[i]);
  modal.hidden = false;
  requestAnimationFrame(() => refitShot());
  lenis?.stop();
  document.addEventListener('keydown', modalKeys);
  if (!REDUCED) {
    gsap.set([$('#mView'), $('.modal__info')], { autoAlpha: 1 });
    gsap.fromTo('.modal__backdrop', { opacity: 0 }, { opacity: 1, duration: 0.4 });
    const pr = panel.getBoundingClientRect();
    const r = origin.getBoundingClientRect();
    gsap.fromTo(panel, {
      x: r.left + r.width / 2 - (pr.left + pr.width / 2),
      y: r.top + r.height / 2 - (pr.top + pr.height / 2),
      scale: clamp(r.width / pr.width, 0.15, 0.9), opacity: 0.4,
    }, { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.75, ease: 'expo.out' });
  }
  requestAnimationFrame(() => $('.modal__close', modal).focus());
}

function closeModal(): void {
  const modal = $('#modal');
  if (modal.hidden) return;
  document.removeEventListener('keydown', modalKeys);
  const done = (): void => {
    modal.hidden = true;
    $('#mView').innerHTML = '';
    gsap.set('.modal__panel', { clearProps: 'all' });
    lenis?.start();
    $('#address').textContent = SITE.workAddress;
    MODAL.origin?.focus({ preventScroll: true });
  };
  if (REDUCED) { done(); return; }
  gsap.to('.modal__backdrop', { opacity: 0, duration: 0.3 });
  gsap.to('.modal__panel', { scale: 0.94, opacity: 0, duration: 0.3, ease: 'power3.in', onComplete: done });
}

function initModal(): void {
  $$('#modal [data-close]').forEach((el) => el.addEventListener('click', closeModal));
  $('#mNext').addEventListener('click', () => stepModal(1));
}

/* =======================================================
   8. CONTACT
   ======================================================= */
type FieldKey = 'name' | 'email' | 'message';

function initForm(): void {
  const form = $<HTMLFormElement>('#quoteForm');
  const btn = $<HTMLButtonElement>('#submitBtn');
  const status = $('#formStatus');
  const fields: Record<FieldKey, HTMLInputElement | HTMLTextAreaElement> = {
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
  keys.forEach((key) => {
    const f = fields[key];
    f.addEventListener('blur', () => { if (f.value) showErr(key, rules[key](f.value)); });
    f.addEventListener('input', () => { if (!rules[key](f.value)) showErr(key, ''); });
  });
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
    if (firstBad) { (firstBad as HTMLElement).focus(); return; }

    const payload = { name: fields.name.value.trim(), email: fields.email.value.trim(), message: fields.message.value.trim() };
    const { formEndpoint, formKey, email: toEmail } = SITE.contact;
    const isFormspree = /formspree\.io/.test(formEndpoint);
    status.classList.remove('is-error');

    if (!formKey && !isFormspree) {
      const body = `Name: ${payload.name}\nEmail: ${payload.email}\n\n${payload.message}`;
      window.location.href = `mailto:${toEmail}?subject=${encodeURIComponent(`Quote request from ${payload.name}`)}&body=${encodeURIComponent(body)}`;
      status.textContent = 'Opening your email app…';
      return;
    }
    btn.disabled = true;
    status.textContent = 'Sending…';
    try {
      const body = isFormspree ? payload
        : { access_key: formKey, subject: `New quote request from ${payload.name}`, from_name: 'Portfolio contact form', replyto: payload.email, ...payload };
      const res = await fetch(formEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean };
      if (!res.ok || json.success === false) throw new Error('send failed');
      status.textContent = '';
      form.hidden = true;
      $('#formDone').hidden = false;
      ScrollTrigger.refresh();
    } catch {
      status.classList.add('is-error');
      status.textContent = `That didn't send. Try again, or email ${toEmail}.`;
    } finally {
      btn.disabled = false;
    }
  });
}

function initCopyEmail(): void {
  const btn = $('#copyEmail');
  const toast = $('#copyToast');
  let t: number | undefined;
  btn.addEventListener('click', async () => {
    const email = btn.dataset.copy ?? '';
    try {
      await navigator.clipboard.writeText(email);
      toast.textContent = 'Copied ✦';
    } catch {
      window.location.href = `mailto:${email}`;
      return;
    }
    toast.classList.add('is-on');
    window.clearTimeout(t);
    t = window.setTimeout(() => { toast.classList.remove('is-on'); }, 1800);
  });
}

/* =======================================================
   9. BOOT
   ======================================================= */
function lazyPrepare(scene: ScrollScene): void {
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    void scene.loadFrames();
  }, { rootMargin: '200% 0px' });
  io.observe(scene.section);
  disposers.push(() => io.disconnect());
}

/**
 * Starts the whole experience. Call once, after the React markup has mounted.
 * Returns a cleanup function that tears everything down again.
 */
export function initSite(): () => void {
  let disposed = false;
  let mm: gsap.MatchMedia | null = null;
  disposers = [];

  const boot = async (): Promise<void> => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    document.documentElement.classList.add('js');
    ScrollTrigger.config({ ignoreMobileResize: true });

    buildWork();
    initAnchors();
    initModal();
    initForm();
    initCopyEmail();

    const scenes = SCENES.map((cfg) => new ScrollScene(cfg));
    const [hero, ...rest] = scenes;
    rest.forEach((s) => { void s.prepare(); });

    lenis = initLenis();
    lenis?.stop();
    await runPreloader(hero);
    // Scenes must know whether they have video frames before their timelines are built.
    await Promise.race([Promise.all(rest.map((sc) => sc.prepare())), wait(3000)]);
    if (disposed) return;

    mm = gsap.matchMedia();
    mm.add({ desktop: '(min-width: 768px)', mobile: '(max-width: 767px)' }, (ctx) => {
      const { mobile } = ctx.conditions as { desktop: boolean; mobile: boolean };
      const cleanups: Array<() => void> = [];
      if (REDUCED) {
        staticScenes(scenes);
      } else {
        cleanups.push(heroScene(hero, mobile));
        cleanups.push(missionScene(mobile));
        orbitScene(rest[0], mobile);
        if (rest[1].cfg.video) ctaVideoScene(rest[1], mobile); else captionScene(rest[1], mobile);
      }
      cleanups.push(initPile(mobile));
      requestAnimationFrame(() => ScrollTrigger.refresh());
      return () => cleanups.forEach((fn) => fn());
    });

    const heroST = (): number => {
      const st = ScrollTrigger.getAll().find((t) => t.trigger === hero.section);
      return st ? st.end : window.innerHeight;
    };
    initNav(heroST);
    initCursor();
    initStats();
    initReveals();
    rest.forEach(lazyPrepare);
    void hero.loadFrames();

    await revealSite();
    if (document.readyState !== 'complete') on(window, 'load', () => ScrollTrigger.refresh());
  };

  void boot();

  return () => {
    disposed = true;
    if (mm) mm.revert();
    ScrollTrigger.getAll().forEach((t) => t.kill());
    disposers.forEach((fn) => fn());
    disposers = [];
    lenis = null;
  };
}