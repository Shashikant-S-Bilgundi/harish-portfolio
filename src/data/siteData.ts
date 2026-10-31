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
}

export const SITE = {
  name: 'Harish Moger',
  role: 'UI/UX & Multimedia Designer',
  year: 2026,
  workAddress: 'harishmoger.design/work', // [CONFIRM] your domain
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
    { value: null, display: 'X+', label: 'Years designing' }, // [CONFIRM] e.g. { value: 4, suffix: '+', label: 'Years designing' }
    { value: 5, label: 'Live brand websites shipped' },
    { value: 11, label: 'Projects featured here' },
    { value: 3, label: 'Disciplines, one designer' },
  ] as Stat[],
};

export const SCENES: SceneConfig[] = [
  {
    id: 'hero', section: '#top', canvas: '#heroCanvas', frames: 'assets/frames/hero',
    art: 'laptop-zoom',
    length: { desktop: 200, mobile: 160 },
  },
  {
    // Your photo appears here only.
    id: 'work', section: '#work-scene', canvas: '#workCanvasScene', frames: 'assets/frames/work',
    art: 'photo-orbit', photo: heroPhoto,
    motion: { zoom: [1, 1, 1], focus: { x: 0.5, y: 0.35 }, drift: 0, soften: 1 },
    length: { desktop: 320, mobile: 240 },
    videoLength: { desktop: 480, mobile: 340 },
  },
  {
    id: 'cta', section: '#cta-scene', canvas: '#ctaCanvas', frames: 'assets/frames/cta',
    art: 'laptop-open-close',
    length: { desktop: 230, mobile: 180 },
  },
];

// Screenshots load from public/assets/work/<slug>/thumb.webp and full.webp.
// Until they exist, each card shows its brand colour and name.
const PROJECT_LIST: Project[] = [
  { slug: 'novara', name: 'Novara Nature Estates', category: 'Website · Real estate',
    url: 'https://www.novaranatureestates.com/', color: '#2F5D3A',
    summary: 'Premium managed-farmland website with a video hero, estate stats, location highlights and a book-a-visit flow.',
    deliverables: ['Web design', 'UI/UX', 'Responsive build'] },
  { slug: 'skyup', name: 'SkyUp Digital Solutions', category: 'Website · Agency',
    url: 'https://skyupdigitalsolutions.com/', color: '#0037CA',
    summary: 'Scroll-story agency site that opens on an "invisible business" moment, then shows what real visibility looks like.',
    deliverables: ['Web design', 'UI/UX', 'Scroll storytelling'] },
  { slug: 'abhicabs', name: 'AbhiCabs', category: 'Website · Mobility',
    url: 'https://www.abhicabs24x7.com/', color: '#C28A00',
    summary: 'Cab booking site with a one-way, round-trip, local and airport booking engine, fleet picker and group quotes.',
    deliverables: ['Web design', 'Booking UX', 'Responsive build'] },
  { slug: 'midori', name: 'Midori', category: 'E-commerce · Wellness',
    url: 'https://shopmidori.in/', color: '#6B7F3A',
    summary: 'Shopify store for herbal supplements, pairing an ancient-herbs, modern-science story with a clean shop flow.',
    deliverables: ['Shopify', 'UI/UX', 'Product pages'] },
  { slug: 'vector-graphics', name: 'The Vector Graphics', category: 'Website · Packaging agency',
    url: 'https://www.thevectorgraphics.com/', color: '#B4532A',
    summary: 'Website for a packaging design agency, built around shelf impact, services and a proposal-first CTA.',
    deliverables: ['Web design', 'UI/UX'] },
  { slug: 'astromudra', name: 'Astromudra', category: 'E-commerce · End to end',
    url: 'https://harishm.framer.website/projects/https-shop-astromudra-com', color: '#9A6B2F',
    summary: 'Shopify site, product images, ads and an Amazon store, designed as one experience.',
    deliverables: ['Shopify', 'Product imagery', 'Ads', 'Amazon store'] },
  { slug: 'invensis', name: 'Invensis Learning', category: 'Website UI · Education',
    url: 'https://harishm.framer.website/projects/invensislearning-com', color: '#1D4ED8',
    summary: 'Website UI for a global training and certification provider.',
    deliverables: ['Website UI'] },
  { slug: 'owl-ink', name: 'The Owl Ink Studio', category: 'Website UI · Lifestyle',
    url: 'https://harishm.framer.website/projects/the-owl-ink-studio-website-ui-design', color: '#B4232C',
    summary: 'Bold, minimal, immersive website for a modern tattoo studio.',
    deliverables: ['Website UI', 'Art direction'] },
  { slug: 'ayur', name: 'Ayur App', category: 'App UI/UX · Wellness',
    url: 'https://harishm.framer.website/projects/ayur-app-case-study', color: '#4D7C0F',
    summary: 'Mobile app for Ayurvedic consultations, herbal remedies and personal wellness routines.',
    deliverables: ['App UI/UX', 'Case study'] },
  { slug: 'udyamcart', name: 'Udyamcart', category: 'App UI/UX · E-commerce',
    url: 'https://harishm.framer.website/projects/coral-spiral-abstract', color: '#0E7490',
    summary: 'Multi-category shopping app designed for local users.',
    deliverables: ['App UI/UX'] },
  { slug: 'taxi-app', name: 'Taxi Booking & Rental App', category: 'App UI/UX · Mobility',
    url: 'https://harishm.framer.website/projects/shopease-redesign-sprint', color: '#CA8A04',
    summary: 'Fast, transparent ride and rental booking with eco-friendly options.',
    deliverables: ['App UI/UX'] },
];

export const PROJECTS: ResolvedProject[] = PROJECT_LIST.map((p) => ({
  ...p,
  thumb: p.thumb || `assets/work/${p.slug}/thumb.webp`,
  full: p.full || `assets/work/${p.slug}/full.webp`,
}));

/** Loose pile layout for the work window on desktop: [x, y, rotation]. */
export const SCATTER: [number, number, number][] = [
  [0.03, 0.06, -5], [0.27, 0.14, 4], [0.52, 0.04, -3], [0.8, 0.1, 6],
  [0.1, 0.5, 3], [0.36, 0.58, -6], [0.6, 0.46, 5], [0.9, 0.55, -4],
  [0.2, 0.94, -2], [0.5, 0.97, 4], [0.76, 0.92, -5],
];