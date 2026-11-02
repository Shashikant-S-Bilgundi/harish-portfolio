/* =========================================================
   LAPTOP SCENES — drawn on canvas, no image files needed.

   paintLaptopZoom       Hero. A closed laptop sits small on a violet horizon;
                         the camera moves in as the lid opens and the screen
                         lights up, then pushes into the screen until it
                         fills the view. heroGeometry() says where the
                         screen is at any moment, so the page can put the
                         text inside it.
   paintLaptopOpenClose  Work scene. The lid opens, the screen lights up with
                         project tiles, then the lid closes again.

   Both take p (0–1), the scroll progress through the pinned scene, so
   scrolling back up plays them in reverse.
   ========================================================= */
export type Painter = (ctx: CanvasRenderingContext2D, w: number, h: number, p: number) => void;
type Pt = [number, number];

const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const seg = (p: number, a: number, b: number): number => clamp((p - a) / (b - a), 0, 1);
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Lid proportions (width ÷ height when fully open, as seen by the camera). */
const LID_RATIO = 1.34;
/** Bezel sizes in lid units (1 unit = 1/1000 of the lid width). */
const BEZEL = 22;
const CHIN = 34;

function roundedPoly(ctx: CanvasRenderingContext2D, pts: Pt[], r: number): void {
  const n = pts.length;
  const [ax, ay] = pts[n - 1], [bx, by] = pts[0];
  ctx.beginPath();
  ctx.moveTo((ax + bx) / 2, (ay + by) / 2);
  for (let i = 0; i < n; i++) {
    const [cx, cy] = pts[i], [nx, ny] = pts[(i + 1) % n];
    ctx.arcTo(cx, cy, nx, ny, r);
  }
  ctx.closePath();
}

const trapezoid = (cx: number, yTop: number, yBottom: number, wTop: number, wBottom: number): Pt[] => [
  [cx - wTop / 2, yTop], [cx + wTop / 2, yTop], [cx + wBottom / 2, yBottom], [cx - wBottom / 2, yBottom],
];

const rect = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

/* ---------- Studio backdrop: dark room with a violet light strip on the horizon ---------- */
function paintStudio(ctx: CanvasRenderingContext2D, w: number, h: number, horizon: number, band: number, strength: number): void {
  ctx.fillStyle = '#07060B';
  ctx.fillRect(0, 0, w, h);

  let g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, `rgba(49,20,99,${0.6 * strength})`);
  g.addColorStop(0.55, 'rgba(7,6,11,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Wide haze around the horizon
  const y0 = horizon - band * 2.4, y1 = horizon + band * 2.4;
  g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, 'rgba(91,33,182,0)');
  g.addColorStop(0.5, `rgba(109,40,217,${0.55 * strength})`);
  g.addColorStop(1, 'rgba(91,33,182,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, w, y1 - y0);

  // Bright core of the light strip
  const c0 = horizon - band * 0.55, c1 = horizon + band * 0.55;
  g = ctx.createLinearGradient(0, c0, 0, c1);
  g.addColorStop(0, 'rgba(167,139,250,0)');
  g.addColorStop(0.35, `rgba(196,181,253,${0.32 * strength})`);
  g.addColorStop(0.5, `rgba(237,233,254,${0.62 * strength})`);
  g.addColorStop(0.65, `rgba(196,181,253,${0.32 * strength})`);
  g.addColorStop(1, 'rgba(167,139,250,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, c0, w, c1 - c0);

  // Floor: darker towards the camera
  const f0 = horizon + band * 0.7;
  g = ctx.createLinearGradient(0, f0, 0, h);
  g.addColorStop(0, 'rgba(4,3,8,0)');
  g.addColorStop(0.4, 'rgba(4,3,8,0.7)');
  g.addColorStop(1, 'rgba(4,3,8,0.92)');
  ctx.fillStyle = g;
  ctx.fillRect(0, f0, w, Math.max(0, h - f0));

  // Vignette
  const m = Math.max(w, h);
  g = ctx.createRadialGradient(w / 2, h / 2, m * 0.22, w / 2, h / 2, m * 0.78);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/* ---------- Hero backdrop, matched to the reference image ----------
   Near-black sky; a bright lavender light strip on the horizon with a tall
   violet glow above it; its reflection fading across a glossy floor.
   Each stop: [distance from the horizon in screen heights, r, g, b]. */
const SKY: [number, number, number, number][] = [
  [-0.59, 10, 9, 16], [-0.39, 12, 10, 26], [-0.307, 20, 14, 39], [-0.247, 28, 20, 55], [-0.187, 43, 32, 83],
  [-0.137, 65, 48, 123], [-0.087, 107, 80, 171], [-0.047, 159, 132, 207], [-0.017, 203, 185, 232], [0, 222, 208, 243],
  [0.008, 179, 161, 214], [0.013, 171, 152, 214], [0.033, 127, 104, 183], [0.063, 84, 63, 145], [0.113, 43, 32, 86],
  [0.163, 25, 16, 49], [0.233, 13, 7, 26], [0.313, 8, 6, 15], [0.42, 9, 8, 14],
];
const NIGHT = [9, 8, 14];

function paintHorizon(ctx: CanvasRenderingContext2D, w: number, h: number, horizon: number, spread: number, strength: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [o, r, gr, b] of SKY) {
    const c = [r, gr, b].map((v, k) => Math.round(NIGHT[k] + (v - NIGHT[k]) * strength));
    g.addColorStop(clamp((horizon + o * h * spread) / h, 0, 1), `rgb(${c[0]},${c[1]},${c[2]})`);
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // The crisp core of the light strip
  const t = Math.max(1, h * 0.0035 * spread);
  const core = ctx.createLinearGradient(0, horizon - t * 2, 0, horizon + t * 2);
  core.addColorStop(0, 'rgba(244,240,255,0)');
  core.addColorStop(0.5, `rgba(244,240,255,${0.85 * strength})`);
  core.addColorStop(1, 'rgba(244,240,255,0)');
  ctx.fillStyle = core;
  ctx.fillRect(0, horizon - t * 2, w, t * 4);
}

/* ---------- What the screen shows when it's lit: a little gallery of project tiles ---------- */
function paintScreenUI(ctx: CanvasRenderingContext2D, x: number, y: number, sw: number, sh: number, colors: string[], glow: number): void {
  ctx.save();
  ctx.globalAlpha = glow;
  let g = ctx.createRadialGradient(x + sw / 2, y + sh * 0.45, 0, x + sw / 2, y + sh * 0.45, sw * 0.75);
  g.addColorStop(0, '#3B1A78');
  g.addColorStop(1, '#120A24');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, sw, sh);

  const pad = sw * 0.05;
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  roundedPoly(ctx, rect(x + pad, y + pad * 0.8, sw * 0.16, sh * 0.035), sh * 0.017);
  ctx.fill();
  roundedPoly(ctx, rect(x + sw - pad - sw * 0.12, y + pad * 0.8, sw * 0.12, sh * 0.035), sh * 0.017);
  ctx.fill();

  const cols = 3, rows = 2, gap = sw * 0.03;
  const top = y + pad * 0.8 + sh * 0.035 + gap;
  const tw = (sw - pad * 2 - gap * (cols - 1)) / cols;
  const th = (y + sh - pad - top - gap * (rows - 1)) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const col = colors[(r * cols + c) % colors.length] || '#7C3AED';
      const tx = x + pad + c * (tw + gap), ty = top + r * (th + gap);
      roundedPoly(ctx, rect(tx, ty, tw, th), Math.min(tw, th) * 0.06);
      g = ctx.createLinearGradient(tx, ty, tx + tw, ty + th);
      g.addColorStop(0, col);
      g.addColorStop(1, '#0B0912');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      roundedPoly(ctx, rect(tx + tw * 0.08, ty + th * 0.62, tw * 0.5, th * 0.07), th * 0.035);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      roundedPoly(ctx, rect(tx + tw * 0.08, ty + th * 0.76, tw * 0.32, th * 0.06), th * 0.03);
      ctx.fill();
    }
  }
  ctx.restore();
}

/* ---------- The laptop ---------- */
interface LaptopOpts {
  cx: number;        // centre x
  hinge: number;     // y of the hinge (where lid meets deck)
  lw: number;        // lid width at the hinge
  lidH: number;      // visible lid height: shrinks as the lid closes
  glow: number;      // 0 = screen off (dark glass), 1 = fully lit
  glare?: number;    // strength of the reflection on the glass (default 1)
  colors?: string[]; // project colours for the lit screen (tiles); without them, a plain lit screen
  deckScale?: number; // <1 flattens the top surface, for a low camera far away
  frontRatio?: number; // front width ÷ back width (perspective taper); default 1.2
  viewH: number;     // canvas height, to skip parts that are off-screen
}

function paintLaptop(ctx: CanvasRenderingContext2D, o: LaptopOpts): void {
  const { cx, hinge, lw, lidH, glow } = o;
  const s = lw / 1000;
  const fullH = lw / LID_RATIO;
  const f = clamp(lidH / fullH, 0, 1);          // how open the lid looks
  const deckH = 64 * s * (o.deckScale ?? 1);
  const shut = 1 - seg(f, 0, 0.12);       // 1 while the lid lies closed on the base
  const baseT = 22 * s;                   // front edge of the base
  const lidT = 20 * s * shut;             // front edge of the closed lid, on top of the base's
  const backW = lw * 0.99, frontW = lw * (o.frontRatio ?? 1.2);
  const front = hinge + deckH;
  const faceBot = front + lidT + baseT;
  const lidTop = hinge - lidH;
  let g: CanvasGradient;

  // Light from the screen spilling into the room
  if (glow > 0) {
    g = ctx.createRadialGradient(cx, hinge - lidH * 0.5, 0, cx, hinge - lidH * 0.5, lw * 1.05);
    g.addColorStop(0, `rgba(139,92,246,${0.42 * glow})`);
    g.addColorStop(1, 'rgba(139,92,246,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - lw * 1.1, hinge - lidH * 0.5 - lw * 1.1, lw * 2.2, lw * 2.2);
  }

  if (hinge < o.viewH + deckH * 4) {
    // Contact shadow
    ctx.save();
    ctx.translate(cx, faceBot + 3 * s);
    ctx.scale(1, 0.1);
    g = ctx.createRadialGradient(0, 0, 0, 0, 0, frontW * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0.75)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-frontW, -frontW, frontW * 2, frontW * 2);
    ctx.restore();

    // Deck
    roundedPoly(ctx, trapezoid(cx, hinge, front, backW, frontW), 10 * s);
    g = ctx.createLinearGradient(0, hinge, 0, front);
    g.addColorStop(0, '#2A2733');
    g.addColorStop(1, '#141219');
    ctx.fillStyle = g;
    ctx.fill();

    // Keyboard and trackpad (hidden while the lid lies closed on top)
    const keys = seg(f, 0.08, 0.35);
    if (keys > 0 && deckH > 14) {
      ctx.fillStyle = `rgba(0,0,0,${0.42 * keys})`;
      const rows = 5, cols = 14;
      for (let r = 0; r < rows; r++) {
        const t0 = 0.08 + r * 0.12, t1 = t0 + 0.09;
        const yA = hinge + deckH * t0, yB = hinge + deckH * t1;
        const rowW = lerp(backW, frontW, (t0 + t1) / 2) * 0.8;
        const kw = rowW / cols;
        for (let c = 0; c < cols; c++) {
          const kx = cx - rowW / 2 + c * kw;
          ctx.fillRect(kx + kw * 0.08, yA, kw * 0.84, yB - yA);
        }
      }
      ctx.strokeStyle = `rgba(255,255,255,${0.07 * keys})`;
      ctx.lineWidth = Math.max(1, 1.2 * s);
      roundedPoly(ctx, trapezoid(cx, hinge + deckH * 0.7, hinge + deckH * 0.94, frontW * 0.3, frontW * 0.32), 4 * s);
      ctx.stroke();
    }
    if (glow > 0) {
      g = ctx.createLinearGradient(0, hinge, 0, front);
      g.addColorStop(0, `rgba(167,139,250,${0.25 * glow})`);
      g.addColorStop(1, 'rgba(167,139,250,0)');
      ctx.fillStyle = g;
      roundedPoly(ctx, trapezoid(cx, hinge, front, backW, frontW), 10 * s);
      ctx.fill();
    }

    // Front edge: the closed lid's edge (while shut) over the base's edge
    if (lidT > 0.5) {
      g = ctx.createLinearGradient(0, front, 0, front + lidT);
      g.addColorStop(0, '#C9C6D4');
      g.addColorStop(0.3, '#8E8A99');
      g.addColorStop(0.8, '#55515C');
      g.addColorStop(1, '#2A262D');
      ctx.fillStyle = g;
      roundedPoly(ctx, rect(cx - frontW / 2, front, frontW, lidT), Math.min(4 * s, lidT / 2));
      ctx.fill();
    }
    g = ctx.createLinearGradient(0, front + lidT, 0, faceBot);
    g.addColorStop(0, '#77737F');
    g.addColorStop(0.5, '#4A4650');
    g.addColorStop(0.85, '#2C2930');
    g.addColorStop(1, '#8C8898'); // the bottom edge catches the floor's light
    ctx.fillStyle = g;
    roundedPoly(ctx, rect(cx - frontW / 2 + 2 * s, front + lidT, frontW - 4 * s, baseT), Math.min(6 * s, baseT / 2));
    ctx.fill();
    // Highlights along the top of the front edge and the seam, brightest in the middle
    g = ctx.createLinearGradient(cx - frontW / 2, 0, cx + frontW / 2, 0);
    g.addColorStop(0, 'rgba(225,222,240,0.15)');
    g.addColorStop(0.5, 'rgba(246,244,252,0.95)');
    g.addColorStop(1, 'rgba(225,222,240,0.15)');
    ctx.strokeStyle = g;
    ctx.lineWidth = Math.max(1, 2.4 * s);
    ctx.beginPath(); ctx.moveTo(cx - frontW / 2 + 6 * s, front); ctx.lineTo(cx + frontW / 2 - 6 * s, front); ctx.stroke();
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = Math.max(1, 1.4 * s);
    ctx.beginPath(); ctx.moveTo(cx - frontW / 2 + 8 * s, front + lidT + 1.5 * s); ctx.lineTo(cx + frontW / 2 - 8 * s, front + lidT + 1.5 * s); ctx.stroke();
    ctx.globalAlpha = 1;
    if (lidT > 0.5) {
      ctx.strokeStyle = 'rgba(16,13,18,0.9)';
      ctx.lineWidth = Math.max(1, 1.6 * s);
      ctx.beginPath(); ctx.moveTo(cx - frontW / 2 + 3 * s, front + lidT); ctx.lineTo(cx + frontW / 2 - 3 * s, front + lidT); ctx.stroke();
    }
    // Sheen across the front edge, brighter toward the right
    g = ctx.createLinearGradient(cx - frontW / 2, 0, cx + frontW / 2, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.62, 'rgba(255,255,255,0.05)');
    g.addColorStop(0.85, 'rgba(255,255,255,0.16)');
    g.addColorStop(1, 'rgba(255,255,255,0.02)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - frontW / 2 + 2 * s, front, frontW - 4 * s, lidT + baseT);

    // Reflection in the glossy floor: the front edge mirrored, fainter with distance
    const gap = 5 * s;
    const mTop = faceBot + gap; // the base's edge reflects first, then the lid's
    ctx.globalAlpha = 0.38;
    g = ctx.createLinearGradient(0, mTop, 0, mTop + baseT);
    g.addColorStop(0, '#8C8898');
    g.addColorStop(0.15, '#2C2930');
    g.addColorStop(1, '#5A5662');
    ctx.fillStyle = g;
    roundedPoly(ctx, rect(cx - frontW / 2 + 2 * s, mTop, frontW - 4 * s, baseT), Math.min(6 * s, baseT / 2));
    ctx.fill();
    if (lidT > 0.5) {
      ctx.globalAlpha = 0.2;
      g = ctx.createLinearGradient(0, mTop + baseT, 0, mTop + baseT + lidT);
      g.addColorStop(0, '#55515C');
      g.addColorStop(1, '#C9C6D4');
      ctx.fillStyle = g;
      roundedPoly(ctx, rect(cx - frontW / 2, mTop + baseT, frontW, lidT), Math.min(4 * s, lidT / 2));
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Fade the reflection into the floor
    g = ctx.createLinearGradient(0, mTop, 0, mTop + (baseT + lidT) * 1.1);
    g.addColorStop(0, 'rgba(40,28,80,0)');
    g.addColorStop(1, 'rgba(40,28,80,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - frontW / 2, mTop, frontW, (baseT + lidT) * 1.1);
  }

  // Closed: the lid lies flat over the deck
  if (f < 0.12) {
    const a = 1 - f / 0.12;
    ctx.globalAlpha = a;
    roundedPoly(ctx, trapezoid(cx, hinge, front, backW, frontW), 10 * s); // exactly over the base, so no edge shows
    // Graphite, catching the violet glow from the horizon behind it
    g = ctx.createLinearGradient(0, hinge, 0, front);
    g.addColorStop(0, '#544383');
    g.addColorStop(0.55, '#5E5578');
    g.addColorStop(1, '#615A77');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(230,226,245,0.18)';
    ctx.lineWidth = Math.max(1, 1.6 * s);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (lidH < 3 * s) return;

  // Lid
  const topW = lw * (1 - 0.035 * f);
  roundedPoly(ctx, trapezoid(cx, lidTop, hinge, topW, lw), 18 * s * Math.max(0.3, f));
  ctx.fillStyle = '#0B0A0F';
  ctx.fill();
  g = ctx.createLinearGradient(cx - lw / 2, lidTop, cx + lw / 2, hinge);
  g.addColorStop(0, 'rgba(236,236,246,0.75)');
  g.addColorStop(0.5, 'rgba(160,160,178,0.22)');
  g.addColorStop(1, 'rgba(236,236,246,0.55)');
  ctx.strokeStyle = g;
  ctx.lineWidth = Math.max(1, 2.4 * s);
  ctx.stroke();

  if (f < 0.1) return;
  const bez = BEZEL * s;
  const sTop = lidTop + bez * f, sBot = hinge - CHIN * s * f;
  const swTop = topW - bez * 2, swBot = lw - bez * 2;
  const sw = swBot, sh = sBot - sTop;
  ctx.save();
  roundedPoly(ctx, trapezoid(cx, sTop, sBot, swTop, swBot), 8 * s * f);
  ctx.clip();

  // Dark glass
  g = ctx.createLinearGradient(0, sTop, 0, sBot);
  g.addColorStop(0, '#0B0A11');
  g.addColorStop(1, '#050408');
  ctx.fillStyle = g;
  ctx.fillRect(cx - sw / 2, sTop, sw, sh);

  if (glow > 0 && o.colors) paintScreenUI(ctx, cx - sw / 2, sTop, sw, sh, o.colors, glow);
  else if (glow > 0) {
    // A plain lit screen: the backdrop for the hero text that sits inside it
    ctx.globalAlpha = glow;
    g = ctx.createRadialGradient(cx, sTop + sh * 0.45, 0, cx, sTop + sh * 0.45, sw * 0.7);
    g.addColorStop(0, '#2C1658');
    g.addColorStop(1, '#0B0912');
    ctx.fillStyle = g;
    ctx.fillRect(cx - sw / 2, sTop, sw, sh);
    ctx.globalAlpha = 1;
  }

  // Violet horizon reflected low in the glass
  g = ctx.createLinearGradient(0, sTop, 0, sBot);
  g.addColorStop(0.6, 'rgba(124,58,237,0)');
  g.addColorStop(0.92, 'rgba(124,58,237,0.16)');
  g.addColorStop(1, 'rgba(124,58,237,0.05)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - sw / 2, sTop, sw, sh);

  // Diagonal glare across the glass
  ctx.beginPath();
  ctx.moveTo(cx + sw * 0.02, sTop);
  ctx.lineTo(cx + sw * 0.6, sTop);
  ctx.lineTo(cx + sw * 0.6, sBot);
  ctx.lineTo(cx + sw * 0.3, sBot);
  ctx.closePath();
  g = ctx.createLinearGradient(cx, sTop, cx + sw * 0.45, sBot);
  const gl = o.glare ?? 1;
  g.addColorStop(0, `rgba(255,255,255,${0.08 * gl})`);
  g.addColorStop(1, `rgba(255,255,255,${0.015 * gl})`);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();

  // Camera
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.arc(cx, lidTop + bez * f * 0.5, Math.max(0.8, 2.4 * s), 0, Math.PI * 2);
  ctx.fill();
}

/* ---------- Hero: the lid opens, then the camera pushes into the screen ---------- */
export interface HeroGeometry {
  approach: number; // 0 far away (closed, small on the horizon) … 1 close up
  open: number;     // 0 closed … 1 open
  push: number;     // 0 … 1 through the push-in
  glow: number;     // screen light
  lw: number; lidH: number; hinge: number; deckScale: number; frontRatio: number;
  horizon: number; spread: number; strength: number;
  /** The screen's rectangle, in the same units as w and h. */
  screen: { x: number; y: number; w: number; h: number };
}

/**
 * Where everything in the hero is at scroll progress p, for a w × h view:
 *   0      the closed laptop sits small on the horizon (as in the reference image)
 *   →0.34  the camera moves in while the lid opens and the screen lights up
 *   →0.86  the camera pushes into the screen until it fills the view
 */
export function heroGeometry(w: number, h: number, p: number): HeroGeometry {
  const portrait = w < h;
  const lw0 = Math.min(h * 0.74, w * (portrait ? 0.86 : 0.42)); // lid width once close up
  const lh0 = lw0 / LID_RATIO;
  const s0 = lw0 / 1000;
  const sw0 = lw0 - BEZEL * 2 * s0, sh0 = lh0 - (BEZEL + CHIN) * s0;
  const zEnd = Math.max(w / sw0, h / sh0) * 1.12;
  const approach = easeInOut(seg(p, 0.02, 0.34));
  const open = easeInOut(seg(p, 0.08, 0.32));
  const push = easeInOut(seg(p, 0.36, 0.86));
  // Far and low, the front is barely wider than the back; close up and higher, much more.
  const ratioFar = 1.035;
  const frontRatio = lerp(ratioFar, 1.2, approach);
  // Far away, the closed laptop's front edge spans 22% of the view (62% on phones).
  const zFar = clamp(((portrait ? 0.62 : 0.224) * w) / ratioFar / lw0, 0.2, 1);
  const zPush = Math.pow(zEnd, push); // exponential zoom reads as a steady camera move
  const z = lerp(zFar, 1, approach) * zPush;
  const cy = h * 0.5;
  const s = s0 * z, lw = lw0 * z;
  // The horizon stays put while the camera moves in at the same height, then drifts during the push.
  const zb = 1 + (zPush - 1) * 0.1;
  const horizon0 = h * (portrait ? 0.6 : 0.587);
  const horizon = horizon0 + (zb - 1) * h * 0.35;
  // Far: the laptop's back edge sits just below the horizon. Close: the open screen is centred.
  const hingeFar = horizon0 + 0.069 * ratioFar * lw0 * zFar;
  const hingeNear = cy + (lh0 * z + (CHIN - BEZEL) * s) / 2;
  const hinge = lerp(hingeFar, hingeNear, approach);
  const lidH = lh0 * z * open; // fully flat when closed
  const f = clamp(lidH / (lw / LID_RATIO), 0, 1);
  const sTop = hinge - lidH + BEZEL * s * f, sBot = hinge - CHIN * s * f;
  const sw = lw - BEZEL * 2 * s;
  return {
    approach, open, push, glow: easeInOut(seg(open, 0.55, 1)), lw, lidH, hinge,
    deckScale: lerp(0.67, 1, approach), // a low, distant camera sees the top surface very flat
    frontRatio,
    horizon, spread: zb, strength: 1 - push * 0.55,
    screen: { x: w / 2 - sw / 2, y: sTop, w: sw, h: Math.max(0, sBot - sTop) },
  };
}

export const paintLaptopZoom: Painter = (ctx, w, h, p) => {
  const g = heroGeometry(w, h, p);
  paintHorizon(ctx, w, h, g.horizon, g.spread, g.strength);
  paintLaptop(ctx, {
    cx: w / 2, hinge: g.hinge, lw: g.lw, lidH: g.lidH, glow: g.glow,
    glare: 1 - 0.75 * g.push, deckScale: g.deckScale, frontRatio: g.frontRatio, viewH: h,
  });
};

/* ---------- Work scene: open, show the work, close ---------- */
export function paintLaptopOpenClose(colors: string[]): Painter {
  return (ctx, w, h, p) => {
    const portrait = w < h;
    const open = easeInOut(seg(p, 0.08, 0.42)) * (1 - easeInOut(seg(p, 0.62, 0.9)));
    const glow = easeInOut(seg(open, 0.55, 1));
    const lw = Math.min(h * 0.58, w * (portrait ? 0.84 : 0.38));
    const lh = lw / LID_RATIO;
    const hinge = h * (portrait ? 0.74 : 0.82);
    paintStudio(ctx, w, h, hinge - lh * 0.15, h * 0.045, 0.55 + 0.3 * glow);
    paintLaptop(ctx, { cx: w / 2, hinge, lw, lidH: lh * (0.03 + 0.97 * open), glow, colors, viewH: h });
  };
}