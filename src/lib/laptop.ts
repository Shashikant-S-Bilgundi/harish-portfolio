/* =========================================================
   LAPTOP SCENES — drawn on canvas, no image files needed.

   paintLaptopZoom       Hero. An open laptop in front of a violet horizon;
                         the camera pushes into its screen until the screen
                         fills the view.
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
  colors?: string[]; // project colours for the lit screen
  viewH: number;     // canvas height, to skip parts that are off-screen
}

function paintLaptop(ctx: CanvasRenderingContext2D, o: LaptopOpts): void {
  const { cx, hinge, lw, lidH, glow } = o;
  const s = lw / 1000;
  const fullH = lw / LID_RATIO;
  const f = clamp(lidH / fullH, 0, 1);          // how open the lid looks
  const deckH = 64 * s;
  const backW = lw * 0.99, frontW = lw * 1.2;
  const front = hinge + deckH;
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
    ctx.translate(cx, front + 4 * s);
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

    // Front lip and its silver edge
    ctx.fillStyle = '#0C0B11';
    roundedPoly(ctx, trapezoid(cx, front, front + 9 * s, frontW, frontW * 0.995), 3 * s);
    ctx.fill();
    g = ctx.createLinearGradient(cx - frontW / 2, 0, cx + frontW / 2, 0);
    g.addColorStop(0, 'rgba(220,220,235,0.05)');
    g.addColorStop(0.5, 'rgba(242,240,250,0.9)');
    g.addColorStop(1, 'rgba(220,220,235,0.05)');
    ctx.strokeStyle = g;
    ctx.lineWidth = Math.max(1, 3 * s);
    ctx.beginPath();
    ctx.moveTo(cx - frontW / 2 + 10 * s, front);
    ctx.lineTo(cx + frontW / 2 - 10 * s, front);
    ctx.stroke();
    // Faint reflection on the glossy floor
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = Math.max(1, 6 * s);
    ctx.beginPath();
    ctx.moveTo(cx - frontW * 0.4, front + 26 * s);
    ctx.lineTo(cx + frontW * 0.4, front + 26 * s);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Closed: the lid lies flat over the deck
  if (f < 0.12) {
    const a = 1 - f / 0.12;
    ctx.globalAlpha = a;
    roundedPoly(ctx, trapezoid(cx, hinge - 2 * s, front - 3 * s, backW, frontW * 0.985), 10 * s);
    g = ctx.createLinearGradient(cx - frontW / 2, hinge, cx + frontW / 2, front);
    g.addColorStop(0, '#24212D');
    g.addColorStop(0.55, '#17151D');
    g.addColorStop(1, '#201D28');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(230,230,240,0.35)';
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

/* ---------- Hero: push into the screen ---------- */
export const paintLaptopZoom: Painter = (ctx, w, h, p) => {
  const portrait = w < h;
  const lw0 = Math.min(h * 0.74, w * (portrait ? 0.86 : 0.42));
  const lh0 = lw0 / LID_RATIO;
  const s0 = lw0 / 1000;
  const sw0 = lw0 - BEZEL * 2 * s0, sh0 = lh0 - (BEZEL + CHIN) * s0;
  const zEnd = Math.max(w / sw0, h / sh0) * 1.12;
  const push = easeInOut(seg(p, 0, 0.74));
  const z = Math.pow(zEnd, push); // exponential zoom reads as a steady camera move
  const cy = h * 0.5;

  // The backdrop is far away, so it moves much less than the laptop
  const zb = 1 + (z - 1) * 0.1;
  const horizon = cy + lh0 * 0.22 * zb + (zb - 1) * h * 0.35;
  paintStudio(ctx, w, h, horizon, h * 0.07 * zb, 1 - push * 0.55);

  const s = s0 * z, lidH = lh0 * z;
  // Keep the centre of the screen on the centre of the view while zooming
  const hinge = cy + (lidH + (CHIN - BEZEL) * s) / 2;
  paintLaptop(ctx, { cx: w / 2, hinge, lw: lw0 * z, lidH, glow: 0, glare: 1 - 0.75 * push, viewH: h });
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