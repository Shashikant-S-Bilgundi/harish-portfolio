/*
 * PrismCarousel — a coverflow for 16:9 videos, written for this site.
 *
 * The centre card plays its video in colour. Either side, the other videos sit
 * as greyscale cards that narrow into strips and slivers toward the edges.
 * Moving to a card sweeps colour across it from the edge it arrives from, with
 * a prism (rainbow) band riding the edge of the sweep.
 *
 * Everything is drawn from one continuous position, so buttons, clicks, keys,
 * drags and sideways trackpad swipes all animate the same way.
 *
 * An item can be a video file (plays by itself, muted) or an `embed` link
 * (e.g. a LinkedIn post): the embed's player loads only once its card is in
 * the centre and the carousel has been on screen, and is removed when you move
 * away (which also stops it). Items without a still show a placeholder card.
 */
import {
  useCallback, useEffect, useMemo, useRef, useState,
  type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent,
} from 'react';
import gsap from 'gsap';
import './PrismCarousel.css';

export interface PrismItem { title: string; caption?: string; image: string; video?: string; embed?: string; source?: string }

interface PrismCarouselProps {
  items: PrismItem[];
  /** Centre video starts muted (default) or with sound. */
  muted?: boolean;
  /** False pauses the centre video (e.g. when scrolled off screen). */
  playing?: boolean;
  /** Seconds per move. */
  duration?: number;
  className?: string;
  label?: string;
}

/** Card widths by distance from the centre, as a share of the centre card's width. */
const LEVELS_WIDE = [1, 0.32, 0.105, 0.035, 0];
const LEVELS_NARROW = [1, 0.1, 0.035, 0, 0];
/** Side cards' height, as a share of the centre card's. */
const SIDE_HEIGHT = 0.65;
/** Short lists repeat until the row has this many cards; the counter still counts real items. */
const MIN_SLOTS = 9;

const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** The value at fractional step `a` through a list (linear between steps). */
const at = (list: number[], a: number): number => {
  const i = Math.min(Math.floor(a), list.length - 1);
  const j = Math.min(i + 1, list.length - 1);
  return lerp(list[i], list[j], a - i);
};
const pad = (n: number): string => String(n).padStart(2, '0');

/** The card's still, or a placeholder when there isn't one yet. */
function Still({ item, grey }: { item: PrismItem; grey?: boolean }) {
  const cls = `prism-carousel__media${grey ? ' prism-carousel__media--grey' : ''}`;
  if (item.image) return <img className={cls} src={item.image} alt="" draggable={false} loading="lazy" />;
  return (
    <div className={`${cls} prism-carousel__ph`}>
      <b aria-hidden="true">▶</b>
      <small>{item.source ? `${item.source} video` : 'Video'}</small>
    </div>
  );
}

export default function PrismCarousel({ items, muted = true, playing = true, duration = 0.9, className = '', label = 'Video carousel' }: PrismCarouselProps) {
  const n = items.length;
  const slots = useMemo(() => {
    if (!n) return [] as number[];
    const reps = Math.max(1, Math.ceil(MIN_SLOTS / n));
    return Array.from({ length: n * reps }, (_, k) => k % n);
  }, [n]);
  const count = slots.length;

  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const colorRefs = useRef<Array<HTMLDivElement | null>>([]);
  const bandRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const posRef = useRef(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const geoRef = useRef({ W: 640, H: 360, gap: 10, levels: LEVELS_WIDE, step: 300 });
  const dragRef = useRef<{ x: number; start: number; lastX: number; lastT: number; v: number; moved: boolean; id: number } | null>(null);
  const wheelTimer = useRef<number | null>(null);
  const justDragged = useRef(false); // a drag ends with a click; ignore that click
  const reduced = useRef(false);
  const [active, setActive] = useState(0);
  const [seen, setSeen] = useState(false); // embeds wait until the carousel has been on screen
  useEffect(() => { if (playing) setSeen(true); }, [playing]);

  const layout = useCallback((pos: number) => {
    const { W, H, gap, levels } = geoRef.current;
    // Centre-to-centre distance from the middle card to the k-th card out.
    const X = [0];
    for (let k = 1; k < levels.length; k++) X.push(X[k - 1] + (levels[k - 1] * W) / 2 + gap + (levels[k] * W) / 2);
    geoRef.current.step = X[1];

    for (let i = 0; i < count; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      let d = i - pos;
      d = ((d % count) + count) % count;
      if (d > count / 2) d -= count;
      const a = Math.abs(d);
      const w = at(levels, a) * W;
      const h = lerp(1, SIDE_HEIGHT, clamp(a, 0, 1)) * H;
      const x = Math.sign(d) * at(X, a);
      const fade = a <= 2.5 ? 1 : clamp(1 - (a - 2.5) / 1.2, 0, 1);
      const hidden = w < 0.5 || fade <= 0.01;
      el.style.width = `${w.toFixed(1)}px`;
      el.style.height = `${h.toFixed(1)}px`;
      el.style.transform = `translate(-50%, -50%) translateX(${x.toFixed(1)}px)`;
      el.style.opacity = hidden ? '0' : fade.toFixed(3);
      el.style.visibility = hidden ? 'hidden' : 'visible';
      el.style.zIndex = String(100 - Math.round(a * 10));

      // Colour sweeps in from the edge the card arrives from; the prism band rides the sweep's edge.
      const rev = clamp(1 - a * 1.25, 0, 1);
      const cut = ((1 - rev) * 100).toFixed(2);
      const color = colorRefs.current[i];
      if (color) color.style.clipPath = d >= 0 ? `inset(0 ${cut}% 0 0)` : `inset(0 0 0 ${cut}%)`;
      const band = bandRefs.current[i];
      if (band) {
        band.style.left = `${((d >= 0 ? rev : 1 - rev) * 100).toFixed(2)}%`;
        band.style.opacity = rev > 0 && rev < 1 ? Math.sin(rev * Math.PI).toFixed(3) : '0';
      }
    }
  }, [count]);

  /** Moves to a card by the shortest way round. */
  const goTo = useCallback((slot: number, animate = true) => {
    if (!count) return;
    let delta = slot - posRef.current;
    delta = ((delta % count) + count) % count;
    if (delta > count / 2) delta -= count;
    const target = posRef.current + delta;
    const next = ((Math.round(target) % count) + count) % count;
    setActive(next);
    tweenRef.current?.kill();
    const proxy = { p: posRef.current };
    tweenRef.current = gsap.to(proxy, {
      p: target,
      duration: animate && !reduced.current ? duration : 0,
      ease: 'power3.inOut',
      onUpdate: () => { posRef.current = proxy.p; layout(proxy.p); },
      onComplete: () => { posRef.current = next; layout(next); },
    });
  }, [count, duration, layout]);

  const step = useCallback((dir: number) => goTo(Math.round(posRef.current) + dir), [goTo]);

  // Sizes follow the carousel's width.
  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      const narrow = width < 700;
      const W = clamp(width * (narrow ? 0.76 : 0.46), 220, 900); // leaves a margin past the outer slivers
      geoRef.current = { ...geoRef.current, W, H: (W * 9) / 16, gap: narrow ? 6 : 10, levels: narrow ? LEVELS_NARROW : LEVELS_WIDE };
      root.style.setProperty('--pc-stage', `${((W * 9) / 16 + 8).toFixed(0)}px`);
      layout(posRef.current);
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [layout]);

  // Sideways wheel / trackpad swipes move it; vertical scrolling is left to the page.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onWheel = (e: WheelEvent): void => {
      if (count < 2 || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      tweenRef.current?.kill();
      posRef.current += clamp(e.deltaX / Math.max(geoRef.current.step, 60), -0.5, 0.5);
      layout(posRef.current);
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
      wheelTimer.current = window.setTimeout(() => goTo(Math.round(posRef.current)), 140);
    };
    root.addEventListener('wheel', onWheel, { passive: false });
    return () => { root.removeEventListener('wheel', onWheel); if (wheelTimer.current) clearTimeout(wheelTimer.current); };
  }, [count, goTo, layout]);

  const onPointerDown = (e: ReactPointerEvent): void => {
    if (count < 2) return;
    tweenRef.current?.kill();
    dragRef.current = { x: e.clientX, start: posRef.current, lastX: e.clientX, lastT: performance.now(), v: 0, moved: false, id: e.pointerId };
  };
  const onPointerMove = (e: ReactPointerEvent): void => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; rootRef.current?.setPointerCapture(drag.id); }
    if (!drag.moved) return;
    const now = performance.now();
    drag.v = (e.clientX - drag.lastX) / Math.max(now - drag.lastT, 1);
    drag.lastX = e.clientX; drag.lastT = now;
    posRef.current = drag.start - dx / Math.max(geoRef.current.step, 60);
    layout(posRef.current);
  };
  const onPointerUp = (): void => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    if (!drag.moved) { goTo(Math.round(posRef.current)); return; }
    const projected = posRef.current - (drag.v * 160) / Math.max(geoRef.current.step, 60);
    goTo(Math.round(projected));
    justDragged.current = true;
    window.setTimeout(() => { justDragged.current = false; }, 0);
  };
  const onKeyDown = (e: ReactKeyboardEvent): void => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  };

  // The centre video follows `muted` and `playing`.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    if (playing) v.play().catch(() => { /* waits for a click; the still shows meanwhile */ });
    else v.pause();
  }, [active, muted, playing]);

  useEffect(() => { layout(posRef.current); }, [layout]);
  useEffect(() => () => { tweenRef.current?.kill(); }, []);

  if (!n) return null;
  const current = items[slots[active]];

  return (
    <div
      ref={rootRef}
      className={`prism-carousel ${className}`.trim()}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="prism-carousel__stage">
        {slots.map((itemIndex, i) => {
          const it = items[itemIndex];
          const isActive = i === active;
          return (
            <div
              key={i}
              className="prism-carousel__card"
              ref={(el) => { cardRefs.current[i] = el; }}
              aria-hidden={!isActive}
              onClick={() => { if (!isActive && !justDragged.current) goTo(i); }}
            >
              <Still item={it} grey />
              <div className="prism-carousel__color" ref={(el) => { colorRefs.current[i] = el; }}>
                <Still item={it} />
                {isActive && it.embed && seen && (
                  <iframe
                    className="prism-carousel__media prism-carousel__embed"
                    src={it.embed}
                    title={it.title}
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                )}
                {isActive && !it.embed && it.video && (
                  <video ref={videoRef} className="prism-carousel__media" src={it.video} poster={it.image || undefined} muted loop playsInline preload="auto" />
                )}
              </div>
              <span className="prism-carousel__band" ref={(el) => { bandRefs.current[i] = el; }} />
            </div>
          );
        })}
      </div>

      <div className="prism-carousel__meta">
        <div className="prism-carousel__caption" key={active} aria-live="polite">
          <p className="prism-carousel__title">{current.title}</p>
          {current.caption && <p className="prism-carousel__sub">{current.caption}</p>}
        </div>
        <div className="prism-carousel__controls">
          <button type="button" className="prism-carousel__btn" aria-label="Previous video" onClick={() => step(-1)}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span className="prism-carousel__count">{pad(slots[active] + 1)} / {pad(n)}</span>
          <button type="button" className="prism-carousel__btn" aria-label="Next video" onClick={() => step(1)}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}