/* =======================================================
   SITE DATA + CONFIG — edit this file to update the content
   ======================================================= */

export type Filter = 'websites' | 'ecommerce' | 'apps';

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
  filters: Filter[];
  url: string;
  color: string;
  summary: string;
  role: string;
  deliverables: string[];
  allowIframe: boolean;
  thumb?: string;
  full?: string;
}

export interface ResolvedProject extends Project {
  thumb: string;
  full: string;
}

export interface Reel {
  src: string;
  poster: string;
  ratio: '16:9' | '9:16';
  title: string;
  placeholder: boolean;
}

export interface Post {
  src: string;
  ratio: '1:1' | '4:5';
  alt: string;
  placeholder: boolean;
}

export interface ContactData {
  email: string;
  phone: string;
  whatsapp: string;
  formEndpoint: string;
  formKey: string;
}

export interface SiteData {
  contact: ContactData;
  stats: Stat[];
  industries: string[];
  projects: Project[];
  reels: Reel[];
  posts: Post[];
}

export interface SceneConfig {
  canvas: string;
  dir: string;
  desktop: number;
  mobile: number;
}

export interface Config {
  heroScreen: { scale: number; mobileScale: number; x: number; y: number };
  pace: {
    hero: number; heroMobile: number;
    scene: number; sceneMobile: number;
    mission: number; missionMobile: number;
  };
  scenes: SceneConfig[];
  scatter: [number, number, number][];
}

export const SITE_DATA: SiteData = {
  contact: {
    email: 'harishmoger03@gmail.com',
    phone: '+918073157844',
    whatsapp: '918073157844', // [CONFIRM] this number is on WhatsApp
    formEndpoint: 'https://api.web3forms.com/submit', // or your Formspree URL
    formKey: '', // [CONFIRM] Web3Forms access key. Empty = opens the visitor's email app
  },

  stats: [
    { value: 5, suffix: '', label: 'Live brand websites shipped' },
    { value: 11, suffix: '', label: 'Projects featured here' },
    { value: 3, suffix: '', label: 'Disciplines, one designer' },
    { value: null, display: 'X+', label: 'Years designing' }, // [CONFIRM] e.g. { value: 4, suffix: '+', label: 'Years designing' }
  ],

  industries: ['Real estate', 'Mobility', 'E-commerce', 'Wellness', 'Packaging', 'Ed-tech', 'Digital marketing', 'Lifestyle studios'],

  // Screenshots load from assets/work/<slug>/thumb.webp and full.webp.
  projects: [
    { slug: 'novara', name: 'Novara Nature Estates', category: 'Website · Real estate', filters: ['websites'],
      url: 'https://www.novaranatureestates.com/', color: '#2F5D3A',
      summary: 'Premium managed-farmland website with a video hero, estate stats, location highlights and a book-a-visit flow.',
      role: '', /* [CONFIRM] e.g. 'UI/UX & web design at SkyUp Digital Solutions' */
      deliverables: ['Web design', 'UI/UX', 'Responsive build'], allowIframe: false },
    { slug: 'skyup', name: 'SkyUp Digital Solutions', category: 'Website · Agency', filters: ['websites'],
      url: 'https://skyupdigitalsolutions.com/', color: '#0037CA',
      summary: 'Scroll-story agency site that opens on an "invisible business" moment, then shows what real visibility looks like.',
      role: '', /* [CONFIRM] */ deliverables: ['Web design', 'UI/UX', 'Scroll storytelling'], allowIframe: false },
    { slug: 'abhicabs', name: 'AbhiCabs', category: 'Website · Mobility', filters: ['websites'],
      url: 'https://www.abhicabs24x7.com/', color: '#C28A00',
      summary: 'Cab booking site with a one-way, round-trip, local and airport booking engine, fleet picker and group quotes.',
      role: '', /* [CONFIRM] */ deliverables: ['Web design', 'Booking UX', 'Responsive build'], allowIframe: false },
    { slug: 'midori', name: 'Midori', category: 'E-commerce · Wellness', filters: ['ecommerce'],
      url: 'https://shopmidori.in/', color: '#6B7F3A',
      summary: 'Shopify store for herbal supplements, pairing an ancient-herbs, modern-science story with a clean shop flow.',
      role: '', /* [CONFIRM] */ deliverables: ['Shopify', 'UI/UX', 'Product pages'], allowIframe: false },
    { slug: 'vector-graphics', name: 'The Vector Graphics', category: 'Website · Packaging agency', filters: ['websites'],
      url: 'https://www.thevectorgraphics.com/', color: '#B4532A',
      summary: 'Website for a packaging design agency, built around shelf impact, services and a proposal-first CTA.',
      role: '', /* [CONFIRM] */ deliverables: ['Web design', 'UI/UX'], allowIframe: false },
    { slug: 'astromudra', name: 'Astromudra Shopify Store', category: 'E-commerce · End to end', filters: ['ecommerce'],
      url: 'https://harishm.framer.website/projects/https-shop-astromudra-com', color: '#9A6B2F',
      summary: 'Shopify site, product images, ads and an Amazon store, designed as one experience.',
      role: 'UI/UX & visual design', deliverables: ['Shopify', 'Product imagery', 'Ads', 'Amazon store'], allowIframe: false },
    { slug: 'invensis', name: 'Invensis Learning', category: 'Website UI · Education', filters: ['websites'],
      url: 'https://harishm.framer.website/projects/invensislearning-com', color: '#1D4ED8',
      summary: 'Website UI for a global training and certification provider.',
      role: 'UI design', deliverables: ['Website UI'], allowIframe: false },
    { slug: 'owl-ink', name: 'The Owl Ink Studio', category: 'Website UI · Lifestyle', filters: ['websites'],
      url: 'https://harishm.framer.website/projects/the-owl-ink-studio-website-ui-design', color: '#B4232C',
      summary: 'Bold, minimal, immersive website for a modern tattoo studio.',
      role: 'UI design', deliverables: ['Website UI', 'Art direction'], allowIframe: false },
    { slug: 'ayur', name: 'Ayur App', category: 'App UI/UX · Wellness', filters: ['apps'],
      url: 'https://harishm.framer.website/projects/ayur-app-case-study', color: '#4D7C0F',
      summary: 'Mobile app for Ayurvedic consultations, herbal remedies and personal wellness routines.',
      role: 'UI/UX design', deliverables: ['App UI/UX', 'Case study'], allowIframe: false },
    { slug: 'udyamcart', name: 'Udyamcart', category: 'App UI/UX · E-commerce', filters: ['apps', 'ecommerce'],
      url: 'https://harishm.framer.website/projects/coral-spiral-abstract', color: '#0E7490',
      summary: 'Multi-category shopping app designed for local users.',
      role: 'UI/UX design', deliverables: ['App UI/UX'], allowIframe: false },
    { slug: 'taxi-app', name: 'Taxi Booking & Rental App', category: 'App UI/UX · Mobility', filters: ['apps'],
      url: 'https://harishm.framer.website/projects/shopease-redesign-sprint', color: '#CA8A04',
      summary: 'Fast, transparent ride and rental booking with eco-friendly options.',
      role: 'UI/UX design', deliverables: ['App UI/UX'], allowIframe: false },
  ],

  // Dummy reels: if a file is missing, the tile shows an animated brand gradient.
  reels: [
    { src: 'assets/motion/reel-01.mp4', poster: '', ratio: '16:9', title: 'Brand film', placeholder: true },
    { src: 'assets/motion/reel-02.mp4', poster: '', ratio: '9:16', title: 'Reel edit', placeholder: true },
    { src: 'assets/motion/reel-03.mp4', poster: '', ratio: '16:9', title: 'Product launch', placeholder: true },
    { src: 'assets/motion/reel-04.mp4', poster: '', ratio: '16:9', title: 'UI motion', placeholder: true },
  ],

  // Dummy posts: empty src = generated placeholder. Add your file path to replace one.
  posts: Array.from({ length: 8 }, (_, i): Post => ({
    src: '', ratio: i % 3 === 1 ? '4:5' : '1:1', alt: `Social post ${i + 1}`, placeholder: true,
  })),
};

export const CONFIG: Config = {
  // Where the laptop screen sits in Scene 1 (fractions of the viewport).
  heroScreen: { scale: 0.44, mobileScale: 0.62, x: 0.5, y: 0.5 },
  // Scroll length of each pinned section, in % of the viewport height. Lower = faster.
  pace: { hero: 300, heroMobile: 220, scene: 250, sceneMobile: 200, mission: 120, missionMobile: 100 },
  scenes: [
    { canvas: '#scene1', dir: 'assets/frames/scene-01', desktop: 150, mobile: 90 },
    { canvas: '#scene2', dir: 'assets/frames/scene-02', desktop: 150, mobile: 90 },
    { canvas: '#scene3', dir: 'assets/frames/scene-03', desktop: 150, mobile: 90 },
  ],
  // Loose collage layout for the work browser: [x, y, rotation]
  scatter: [
    [0.03, 0.05, -5], [0.29, 0.12, 4], [0.55, 0.03, -3], [0.84, 0.09, 6],
    [0.10, 0.47, 3], [0.36, 0.55, -6], [0.62, 0.44, 5], [0.92, 0.52, -4],
    [0.19, 0.93, -2], [0.49, 0.96, 4], [0.76, 0.91, -5],
  ],
};

export const PROJECTS: ResolvedProject[] = SITE_DATA.projects.map((p) => ({
  ...p,
  thumb: p.thumb || `assets/work/${p.slug}/thumb.webp`,
  full: p.full || `assets/work/${p.slug}/full.webp`,
}));