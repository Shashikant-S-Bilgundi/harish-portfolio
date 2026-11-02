/* =======================================================
   SITE DATA + CONFIG — edit this file to update the content
   ======================================================= */
import heroPhoto from '../assets/heroimage.jpeg';

export interface Stat {
  value: number | null;
  suffix?: string;
  display?: string;
  label: string;
}

export interface Project {
  slug: string;
  name: string;
  category: string;
  url: string;
  color: string;
  summary: string;
  deliverables: string[];
  /** The project's image (a Cloudinary link). Used for its card, popup and gallery tile. */
  image?: string;
  thumb?: string;
  full?: string;
}

export interface ResolvedProject extends Project {
  thumb: string;
  full: string;
}

/**
 * How your photo is framed (and, for `photo`, how it moves).
 * focus: the point to keep in view, as fractions of the photo (0–1).
 *        Set it to where your face is: { x: 0.5, y: 0.3 } = centre, upper third.
 * zoom:  [start, middle, end] — 1 = photo just covers the screen. (`photo` only)
 * drift: slow vertical travel across the scroll. (`photo` only)
 * soften: >1 renders the photo softer. (`photo` only)
 */
export interface PhotoMotion {
  zoom: [number, number, number];
  focus: { x: number; y: number };
  drift: number;
  soften: number;
}

/**
 * What a scene shows until a Higgsfield video's frames are added for it
 * (see HIGGSFIELD.md). Frames always win when they exist.
 *   laptop-zoom        the camera pushes into a laptop screen (hero)
 *   photo-orbit        your photo turns in 3D while dashboards float around it
 *   laptop-open-close  a laptop opens, shows your work, then closes
 *   photo              your photo, with the zoom described by `motion`
 */
export type SceneArt = 'laptop-zoom' | 'photo-orbit' | 'laptop-open-close' | 'photo';

export interface SceneConfig {
  id: 'hero' | 'work' | 'cta';
  section: string;
  canvas: string;
  /** Folder that `npm run frames` writes into (served from /public). */
  frames: string;
  art: SceneArt;
  photo?: string;
  motion?: PhotoMotion;
  /** Scroll length while the scene is pinned, in % of the screen height. Lower = faster. */
  length: { desktop: number; mobile: number };
  /** Scroll length when a Higgsfield video plays instead (a 360° turn needs more room). */
  videoLength?: { desktop: number; mobile: number };
  /** A video played straight from its link (e.g. Cloudinary) instead of local frames. */
  video?: SceneVideo;
}

/**
 * A scene video hosted online. With a Cloudinary link the site requests single
 * frames from it (smooth); with any other link, or if Cloudinary refuses, it
 * scrubs the video file itself.
 */
export interface SceneVideo {
  url: string;
  /** Length of the whole video file, in seconds. */
  duration: number;
  /** The part of the video the scroll plays, in seconds. */
  from: number;
  to: number;
  /** How many frames to request across that part. More = smoother, heavier. */
  frames: { desktop: number; mobile: number };
  /**
   * Share of the pinned scroll the video plays over (0–1); for the rest it
   * holds its last frame. Default 1.
   */
  scrollShare?: number;
  /**
   * Show the video smaller than the screen: `height` is its height as a share
   * of the view (it keeps its shape, sits centred below the nav, and its edges
   * fade into the page). From `fillFrom` (0–1 through the video) it grows to
   * fill the screen. Omit to fill the screen throughout.
   */
  inset?: { height: number; fillFrom?: number };
  /**
   * Where the camera is pointing over time, as [second, degrees turned]. The
   * floating windows travel by the same amount so they move with the room.
   */
  turn?: [number, number][];
}

export const SITE = {
  name: 'Harish Moger',
  role: 'UI/UX & Multimedia Designer',
  year: 2026,
  workAddress: 'harishmoger.design/work', // [CONFIRM] your domain
  /** Hero: false = open on the closed laptop alone, text appears inside the screen;
   *  true = show the text above the closed laptop and drop it into the screen. */
  heroTextAtStart: false,
  contact: {
    email: 'harishmoger03@gmail.com',
    formEndpoint: 'https://api.web3forms.com/submit', // or your Formspree URL
    formKey: '', // [CONFIRM] Web3Forms access key. Empty = opens the visitor's email app
  },
  socials: [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/harish-moger-97531618b/' },
    { label: 'Behance', url: 'https://www.behance.net/harishmoger2' },
  ],
  stats: [
    { value: 3.5, label: 'Years of experience' },
    { value: 5, label: 'Live brand websites shipped' },
    { value: 7, label: 'Projects featured here' }, // keep in step with PROJECT_LIST below
    { value: 3, label: 'Disciplines, one designer' },
  ] as Stat[],
};

export const SCENES: SceneConfig[] = [
  {
    id: 'hero', section: '#top', canvas: '#heroCanvas', frames: 'assets/frames/hero',
    art: 'laptop-zoom',
    length: { desktop: 300, mobile: 240 }, // the lid opens first, then the push-in
  },
  {
    // Your photo appears here only.
    id: 'work', section: '#work-scene', canvas: '#workCanvasScene', frames: 'assets/frames/work',
    art: 'photo-orbit', photo: heroPhoto,
    motion: { zoom: [1, 1, 1], focus: { x: 0.5, y: 0.35 }, drift: 0, soften: 1 },
    length: { desktop: 320, mobile: 240 },
    videoLength: { desktop: 480, mobile: 340 },
    // Your 360° video, served from Cloudinary. Remove this block to go back to the 3D photo.
    video: {
      url: 'https://res.cloudinary.com/dmyj1echa/video/upload/v1793466972/Profile_rotation_gemini_watermark_removed_hhgyln.mp4',
      duration: 9.963,
      from: 2.3, // skips the still opening, so the turn starts as soon as the section pins
      to: 9.9,
      frames: { desktop: 160, mobile: 100 },
      // Measured from the video: front until 2.6s, behind you 4.75–6.25s, front again by 8s.
      turn: [
        [2.3, 0], [2.6, 0], [3.0, 15], [3.25, 25], [3.5, 40], [3.75, 60], [4.0, 85], [4.25, 125],
        [4.5, 160], [4.75, 175], [5.0, 180], [6.25, 182], [6.5, 195], [6.75, 215], [7.0, 250],
        [7.25, 285], [7.5, 335], [7.75, 352], [8.0, 360], [9.9, 360],
      ],
    },
  },
  {
    // Closing scene: you lift a laptop, open it and push it toward the camera
    // until the screen fills the view; then it glows white, greys and goes dark.
    // Remove `video` to go back to the drawn laptop.
    id: 'cta', section: '#cta-scene', canvas: '#ctaCanvas', frames: 'assets/frames/cta',
    art: 'laptop-open-close',
    length: { desktop: 230, mobile: 180 },
    videoLength: { desktop: 340, mobile: 260 },
    video: {
      url: 'https://res.cloudinary.com/dmyj1echa/video/upload/v1793466950/Part_202_993cd818_1080p_gemini_watermark_removed_zcqwgj.mp4',
      duration: 9.64,
      from: 0,
      to: 6.55, // the moment the screen fills the frame (after this the video pulls back)
      frames: { desktop: 120, mobile: 80 },
      scrollShare: 0.66, // the last third of the scroll is the glow-out
      // Smaller than the screen so your head isn't cut off under the nav; it grows to
      // fill the screen as the laptop comes toward the camera.
      inset: { height: 0.82, fillFrom: 0.78 },
    },
  },
];

// Each project's picture comes from its `image` link (sized and compressed by
// Cloudinary), or else public/assets/work/<slug>/thumb.webp and full.webp.
// Without either, the card shows the brand colour and name.
const PROJECT_LIST: Project[] = [
  { slug: 'novara', name: 'Novara Nature Estates', category: 'Website · Real estate',
    url: 'https://www.novaranatureestates.com/', color: '#2F5D3A',
    image: 'https://res.cloudinary.com/dmyj1echa/image/upload/v1793471406/Novara_ddf2mg.png',
    summary: 'Premium managed-farmland website with a video hero, estate stats, location highlights and a book-a-visit flow.',
    deliverables: ['Web design', 'UI/UX', 'Responsive build'] },
  { slug: 'skyup', name: 'SkyUp Digital Solutions', category: 'Website · Agency',
    url: 'https://skyupdigitalsolutions.com/', color: '#0037CA',
    image: 'https://res.cloudinary.com/dmyj1echa/image/upload/v1793472007/SKYUP_tqc48m.png',
    summary: 'Scroll-story agency site that opens on an "invisible business" moment, then shows what real visibility looks like.',
    deliverables: ['Web design', 'UI/UX', 'Scroll storytelling'] },
  { slug: 'midori', name: 'Midori', category: 'E-commerce · Wellness',
    url: 'https://shopmidori.in/', color: '#6B7F3A',
    image: 'https://res.cloudinary.com/dmyj1echa/image/upload/v1793472928/Midori_wkeqli.png',
    summary: 'Shopify store for herbal supplements, pairing an ancient-herbs, modern-science story with a clean shop flow.',
    deliverables: ['Shopify', 'UI/UX', 'Product pages'] },
  { slug: 'abhicabs', name: 'AbhiCabs', category: 'Website · Mobility',
    url: 'https://www.abhicabs24x7.com/', color: '#C28A00',
    image: 'https://res.cloudinary.com/dmyj1echa/image/upload/v1793473040/Abhicabs_i9x9qi.png',
    summary: 'Cab booking site with a one-way, round-trip, local and airport booking engine, fleet picker and group quotes.',
    deliverables: ['Web design', 'Booking UX', 'Responsive build'] },
  { slug: 'vector-graphics', name: 'The Vector Graphics', category: 'Website · Packaging agency',
    url: 'https://www.thevectorgraphics.com/', color: '#B4532A',
    image: 'https://res.cloudinary.com/dmyj1echa/image/upload/v1793471517/vector_graphics_portfolio_hero_1920x1080_ihm2a9.png',
    summary: 'Website for a packaging design agency, built around shelf impact, services and a proposal-first CTA.',
    deliverables: ['Web design', 'UI/UX'] },
  { slug: 'invensis', name: 'Invensis Learning', category: 'Website · Education',
    url: 'https://www.invensislearning.com/in/', color: '#1D4ED8',
    image: 'https://res.cloudinary.com/dmyj1echa/image/upload/v1793472929/Invensis_Coverup_main_obakac.webp',
    summary: 'Website UI for a global training and certification provider.',
    deliverables: ['Website UI'] },
  { slug: 'astromudra', name: 'Astromudra', category: 'E-commerce · End to end',
    url: 'https://shop.astromudra.com/', color: '#9A6B2F',
    image: 'https://res.cloudinary.com/dmyj1echa/image/upload/v1793473220/Astromudra_Landing_Page_Image_1_twho5g.webp',
    summary: 'Shopify site, product images, ads and an Amazon store, designed as one experience.',
    deliverables: ['Shopify', 'Product imagery', 'Ads', 'Amazon store'] },
];

/**
 * Cloudinary resizes and compresses an image on the fly when settings are added
 * after /upload/: f_auto picks the best format for each browser (WebP/AVIF),
 * q_auto the quality, c_limit,w_… a maximum width (never enlarging).
 */
const cld = (url: string, settings: string): string =>
  url.includes('/image/upload/') ? url.replace('/image/upload/', `/image/upload/${settings}/`) : url;

export const PROJECTS: ResolvedProject[] = PROJECT_LIST.map((p) => ({
  ...p,
  // Cards are at most ~300px wide (600px on sharp screens); the popup up to ~900px.
  thumb: p.thumb || (p.image ? cld(p.image, 'f_auto,q_auto,c_limit,w_800') : `assets/work/${p.slug}/thumb.webp`),
  full: p.full || (p.image ? cld(p.image, 'f_auto,q_auto,c_limit,w_1800') : `assets/work/${p.slug}/full.webp`),
}));

/** Loose pile layout for the work window on desktop: [x, y, rotation]. */
export const SCATTER: [number, number, number][] = [
  [0.04, 0.08, -5], [0.3, 0.16, 4], [0.56, 0.05, -3], [0.84, 0.12, 6],
  [0.14, 0.64, 3], [0.44, 0.72, -5], [0.74, 0.62, 4],
];

/* =======================================================
   VIDEO CAROUSELS
   FILMS: 16:9 videos for the wide (prism) carousel.
   REELS: 9:16 videos for the depth carousel.
   Cloudinary video links get their stills (posters) made automatically.
   ======================================================= */
export interface ShowcaseVideo {
  title: string;
  caption?: string;
  /** The video file, e.g. a Cloudinary link. Plays by itself, muted, in the centre card. */
  video?: string;
  /**
   * Or an embedded player's link: the `src` of an embed code (e.g. LinkedIn's
   * <iframe src="…">). It plays in that site's own player, which the visitor
   * starts; it loads only when its card is in the centre. (16:9 carousel only.)
   */
  embed?: string;
  /** Where an embed comes from, shown on its card until it has a still, e.g. 'LinkedIn'. */
  source?: string;
  /** Still shown on the side cards and before the video plays. Made automatically for
   *  Cloudinary video links; for embeds, add one (e.g. a screenshot on Cloudinary). */
  poster?: string;
  /** For Cloudinary links: which second to take the automatic still from. */
  posterAt?: number;
}
export interface ResolvedShowcaseVideo extends ShowcaseVideo { poster: string }

/** A still frame from a Cloudinary video (so_ = second), as a resized JPEG. */
const cldPoster = (video: string, at: number, width: number): string =>
  video.includes('/video/upload/')
    ? video
      .replace('/video/upload/', `/video/upload/so_${at.toFixed(2)},w_${width},c_limit,q_auto:eco/`)
      .replace(/\.(mp4|mov|webm|m4v)(\?.*)?$/i, '.jpg')
    : '';

const resolveVideos = (list: ShowcaseVideo[], width: number): ResolvedShowcaseVideo[] =>
  list.map((v) => ({ ...v, poster: v.poster || (v.video ? cldPoster(v.video, v.posterAt ?? 1, width) : '') }));

// Titles come from the file names. [CONFIRM] Edit the titles and captions as you like;
// posterAt picks the second the side cards' still is taken from (default 1).
export const FILMS = resolveVideos([
  { title: 'Soda juice ad', caption: 'Product ad',
    video: 'https://res.cloudinary.com/dmyj1echa/video/upload/v1793611526/Soda_Juice_Ad_1_iwwuhq.mp4' },
  { title: 'SkyUp: all services', caption: 'Services video for SkyUp Digital Solutions',
    video: 'https://res.cloudinary.com/dmyj1echa/video/upload/v1793611597/Skyup_All_Service_owbjlq.mp4' },
  { title: 'Product sale promo', caption: 'Promo video',
    video: 'https://res.cloudinary.com/dmyj1echa/video/upload/v1793611651/Product_Sale_Promo_Video_k6p7d5.mp4' },
  { title: 'Perfume animation', caption: 'Product animation',
    video: 'https://res.cloudinary.com/dmyj1echa/video/upload/v1793611682/Perfume_Animation_Video_jaa9qb.mp4' },
  { title: 'Food animation', caption: 'Motion graphics',
    video: 'https://res.cloudinary.com/dmyj1echa/video/upload/v1793611726/Food_Animation_Video_qsb7wm.mp4' },
], 1280);

export const REELS = resolveVideos([
  { title: 'Website development', caption: 'Service reel',
    video: 'https://res.cloudinary.com/dmyj1echa/video/upload/v1793611828/Website_Development_josrli.mp4' },
  { title: 'Website ad', caption: 'Ad reel',
    video: 'https://res.cloudinary.com/dmyj1echa/video/upload/v1793611866/Website_Ad_1_qg55t9.mp4' },
  { title: 'Roll Task', caption: 'Reel',
    video: 'https://res.cloudinary.com/dmyj1echa/video/upload/v1793611975/Roll_Task_iknpq6.mp4' },
  { title: 'AI podcast', caption: 'Video editing service',
    video: 'https://res.cloudinary.com/dmyj1echa/video/upload/v1793612025/Ai_Podcast_-_Video_Editing_Service_kwdxwn.mp4' },
  { title: 'Video editing service', caption: 'Service reel',
    video: 'https://res.cloudinary.com/dmyj1echa/video/upload/v1793612064/Video_Editing_Service_Video_krpfwo.mp4' },
], 720);