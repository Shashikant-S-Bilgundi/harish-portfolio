# Harish Moger — Portfolio

Vite + React + TypeScript, with GSAP (ScrollTrigger, SplitText, Draggable,
Inertia) and Lenis smooth scrolling.

## Run it

```bash
npm install
npm run dev        # local site
npm run build      # production build in dist/
```

Your photo must be at **`src/assets/heroimage.jpeg`** (the build fails without it).

## Page flow

Preloader → **Hero** (pinned: the camera pushes into a laptop screen) → Stats →
Mission (words light up as you scroll) → **Work scene** (pinned: your photo turns
in 3D while design dashboards float around it) → Work (drag and throw the cards,
click to open) → **Closing scene** (pinned: a laptop opens, shows your projects,
closes) → Contact → Footer

The laptops are drawn in code (`src/lib/laptop.ts`) and the dashboards are HTML
(`src/components/WorkScene.tsx`), so none of it needs image files.
Any of the three scenes can play a Higgsfield video instead: see **HIGGSFIELD.md**.

## Where to change things

| What | Where |
| --- | --- |
| Projects, stats, contact details, socials | `src/data/siteData.ts` |
| Where your face is, so it stays in view | `motion.focus` of the `work` scene in `siteData.ts` |
| The dashboards: content, position, depth | `src/components/WorkScene.tsx` and the `.p-…` rules in `styles.css` |
| What each scene shows, and how long it stays pinned | `art` and `length` in `SCENES` in `siteData.ts` |
| How the laptops look and move | `src/lib/laptop.ts` |
| Headlines and body copy | the files in `src/components/` |
| Colours, type, layout | `src/styles.css` (tokens at the top) |
| Scroll choreography | `src/lib/engine.ts` |
| Project screenshots | `public/assets/work/<slug>/thumb.webp` (card, about 800×500) and `full.webp` (full-page) |

Cards show the project's colour and name until a screenshot exists.

## Before you launch

Search the code for `[CONFIRM]`:

- Years designing (`stats` in `siteData.ts`)
- Your domain for the work window's address bar (`workAddress`)
- A Web3Forms access key (`formKey`). Without one, the form opens the visitor's email app.
- A share image at `public/assets/og.jpg`, 1200×630