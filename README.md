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

Preloader → **Hero** (pinned: a closed laptop on a violet horizon; the camera moves in as it opens, the text appears in its screen, then the camera pushes in) → Stats →
Mission (words light up as you scroll) → **Work scene** (pinned: your photo turns
in 3D while design dashboards float around it) → Work (drag and throw the cards,
click to open) → Motion & visuals (16:9 videos, prism carousel) → Reels (9:16
videos, depth carousel) → **Closing scene** (pinned: your video, you hold a laptop out until its
screen fills the view, then it glows out) → Contact → Footer

The second section plays your 360° video straight from Cloudinary: the site asks
Cloudinary for single frames of it (smooth scrolling, nothing to store in the
project). If Cloudinary refuses, it scrubs the video file itself; if that fails
too, it shows your photo.

The laptops are drawn in code (`src/lib/laptop.ts`) and the dashboards are HTML
(`src/components/WorkScene.tsx`), so none of it needs image files.
Any of the three scenes can play a Higgsfield video instead: see **HIGGSFIELD.md**.

## Where to change things

| What | Where |
| --- | --- |
| Projects, stats, contact details, socials | `src/data/siteData.ts` |
| The résumé behind the header's Resume button | `public/Harish_Moger_Resume.pdf` (replace the file, keep the name) |
| The 16:9 videos (prism carousel) and 9:16 videos (depth carousel) | `FILMS` and `REELS` in `src/data/siteData.ts`: a `video` link (Cloudinary), or for 16:9 an `embed` link such as LinkedIn's embed `src` |
| Whether the hero text shows above the closed laptop at the start | `heroTextAtStart` in `src/data/siteData.ts` |
| Where your face is, so it stays in view | `motion.focus` of the `work` scene in `siteData.ts` |
| The floating windows' content | `src/components/WorkScene.tsx` |
| The second section's 360° video: link, part played, camera angles | `video` in the `work` scene in `siteData.ts` |
| The closing scene's video: link, part played, where the glow-out starts | `video` in the `cta` scene in `siteData.ts` (`scrollShare`) |
| How dark the dim over that video is | `--dim` on `.scene__dim` in `styles.css` (0 = none) |
| Where each floating window sits (desktop and phone) | the `.p-…` rules in `styles.css`: `--a` where it starts on its circle round you, `--y` height, `--w` width |
| Project images (cards, popup, second-section dashboards) | `image` on each project in `siteData.ts` (a Cloudinary link, resized automatically), or `public/assets/work/<slug>/thumb.webp` |
| What each scene shows, and how long it stays pinned | `art` and `length` in `SCENES` in `siteData.ts` |
| How the laptops look and move | `src/lib/laptop.ts` |
| Headlines and body copy | the files in `src/components/` |
| Colours, type, layout | `src/styles.css` (tokens at the top) |
| Scroll choreography | `src/lib/engine.ts` |

Cards show the project's colour and name until an image exists.

## Before you launch

Search the code for `[CONFIRM]`:


- Your domain for the work window's address bar (`workAddress`)
- A Web3Forms access key (`formKey`). Without one, the form opens the visitor's email app.
- A share image at `public/assets/og.jpg`, 1200×630