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
import { SITE, SCENES, PROJECTS, SCATTER, type SceneConfig, type ResolvedProject } from '../data/siteData';
import { paintLaptopZoom, paintLaptopOpenClose, type Painter } from './laptop';

gsap.registerPlugin(ScrollTrigger, SplitText, Draggable, InertiaPlugin);

/* =======================================================
   1. HELPERS
   ======================================================= */
const $ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document): T => c.querySelector<T>(s) as T;
const $$ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document): T[] => Array.from(c.querySelectorAll<T>(s));
const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
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
  /** 'none' = the scene is built from HTML (the 3D orbit), so the canvas only plays frames. */
  mode: 'photo' | 'paint' | 'frames' | 'none' = 'paint';

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

  private loadFrame(i: number): Promise<boolean> {
    this.requested.add(i);
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { this.frames[i] = img; resolve(true); };
      img.onerror = () => resolve(false);
      img.src = `${this.dir}/${String(i + 1).padStart(4, '0')}.${this.ext}`;
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
    const next = clamp(p, 0, 1);
    if (next === this.p && this.mode !== 'frames') return;
    this.p = next;
    this.render();
  }

  render(force = false): void {
    const { ctx } = this;
    const { width: w, height: h } = this.canvas;

    if (this.mode === 'none') return;
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
      cover(ctx, a, a.naturalWidth, a.naturalHeight, w, h, 1, 0.5, 0.5);
      const b = this.frames[i] && t > 0.02 ? this.frames[i + 1] : undefined;
      if (b) {
        ctx.globalAlpha = t;
        cover(ctx, b, b.naturalWidth, b.naturalHeight, w, h, 1, 0.5, 0.5);
        ctx.globalAlpha = 1;
      }
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
      .from('.hero [data-intro]', { autoAlpha: 0, y: 16, duration: 0.8, ease: 'power3.out', stagger: 0.07 }, '<0.35');
  });
}

/* =======================================================
   4. PINNED SCENES
   ======================================================= */
function pinScene(scene: ScrollScene, mobile: boolean, onUpdate?: (self: ScrollTrigger) => void): gsap.core.Timeline {
  const proxy = { p: 0 };
  const { length, videoLength } = scene.cfg;
  const len = scene.mode === 'frames' && videoLength ? videoLength : length;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: scene.section, start: 'top top',
      end: `+=${mobile ? len.mobile : len.desktop}%`,
      pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true, onUpdate,
    },
  });
  tl.to(proxy, { p: 1, duration: 1, onUpdate: () => scene.set(proxy.p) }, 0);
  scene.set(0);
  return tl;
}

/** Hero: the text stays put while the camera pushes into the laptop. The nav arrives once the screen fills the view. */
function heroScene(scene: ScrollScene, mobile: boolean): void {
  const nav = $('#nav');
  pinScene(scene, mobile, (self) => nav.classList.toggle('is-in', self.progress > 0.72));
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
function orbitScene(scene: ScrollScene, mobile: boolean): void {
  const s = scene.section;
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
  const panels = $$('.panel__in', s).filter((el) => !el.closest('.p-projects'));
  const board = $('.p-projects .panel__in', s);
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
  scenes.forEach((s, i) => s.set(i === 2 ? 0.5 : 0.15)); // the closing laptop is shown open
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
        gsap.to(o, { n: Number(v.dataset.count), duration: 1.6, delay: i * 0.1, ease: 'power3.out',
          onUpdate: () => { v.textContent = String(Math.round(o.n)); } });
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
  [['.work__head > *', '.work__head'], ['.contact__inner > *', '.contact']].forEach(([items, trigger]) => {
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
    ring.classList.toggle('is-link', !!t.closest?.('a, button, label, input, textarea, .card'));
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
  const img = new Image();
  img.className = 'modal__shot';
  img.alt = `Full-page screenshot of ${p.name}`;
  img.decoding = 'async';
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
        heroScene(hero, mobile);
        cleanups.push(missionScene(mobile));
        orbitScene(rest[0], mobile);
        captionScene(rest[1], mobile);
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