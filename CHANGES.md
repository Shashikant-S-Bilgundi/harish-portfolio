# What changed

## Round 4

- **Ready for a 360° Higgsfield orbit in the second section.** When its frames
  are added, the video takes over the whole scene (the 3D photo and dashboards
  step aside, since the video has its own), and the section scrolls longer.
- **Smoother video scenes everywhere:** between two frames the site now blends
  them, so slow scrolling never steps.
- `npm run frames` takes `--frames N` for more frames (200 suits a 360° turn).
- HIGGSFIELD.md has the exact model, settings and prompt for the 360° shot.

## Round 3

- **Second section rebuilt to match the new recording.** Your photo now sits in
  a real 3D space and turns as you scroll, like a camera circling you. Seven
  dashboards (colour, typography, layers, motion, icons, assets, and a Projects
  board with your real projects) float around it at different depths, arrive one
  by one, and shift with the rotation. The Projects board slides in front near
  the end, then the caption appears.
- **Your photo is still in one place only:** it moved from the closing scene to
  this one.
- **The laptop open/close moved** to the closing "Your project could be next." scene.

## Round 2

- **Horizontal scroll fixed.** The pinned sections were measured while the
  loading screen hid the scrollbar, so they ended up one scrollbar-width too
  wide. `scrollbar-gutter: stable` on `html` reserves that space from the start;
  `overflow-x: clip` on `body` is a safety net.
- **Hero matches the screen recording.** A drawn laptop in front of a violet
  horizon; scrolling pushes the camera into its screen while the centred text
  stays still. The nav and a top progress bar appear when the push-in ends.
- **Laptop open/close is back,** in the "One designer. Every detail." scene:
  the lid opens, the screen lights up with your project tiles, then it closes.
- **Your photo appears in one place only:** the closing "Your project could be
  next." scene.
- Styling to match the recording: purple gradient accent words (no italics),
  purple monospaced eyebrows with ◆, purple buttons, a banded stats row with
  dividers, a centred mission statement, and a cursor ring.
- New files: `src/lib/laptop.ts`, `src/components/PageFx.tsx`.

## Round 1

Rebuilt to follow the section flow and scroll behaviour of joshbutchersites.com,
using your own name, copy, projects and colours.

## Fixed

- **Missing base stylesheet.** `style.css` had been overwritten with the same
  "V2 overrides" as `style-v2.css`, so buttons, nav, preloader and layout had no
  styles. Replaced by one complete `src/styles.css`.

## Added

- `src/lib/engine.ts`: the scroll engine (replaces `src/lib/portfolio.ts`).
- `src/styles.css`: complete stylesheet.
- `src/components/WorkScene.tsx` (replaces `Builder.tsx`) and
  `src/components/ProjectModal.tsx` (replaces `Overlays.tsx`).
- `scripts/make-frames.mjs` and `npm run frames`: Higgsfield MP4 → frames.
- `HIGGSFIELD.md`, `README.md` (replaces the Vite template readme), this file.
- `ffmpeg-static` dev dependency, so the frames command needs no separate ffmpeg.

## Rewritten

- `src/App.tsx`, `src/main.tsx`, `src/data/siteData.ts`, and every component in
  `src/components/`.
- `index.html`: loads Instrument Serif instead of JetBrains Mono.
- `package.json`: adds the `frames` script. `.gitignore`: ignores `videos/`.

## Removed

- `src/lib/portfolio.ts`, `src/style.css`, `src/style-v2.css`, `src/index.css`, `src/App.css`
- `src/components/Arrow.tsx`, `Builder.tsx`, `GlobalFx.tsx`, `Overlays.tsx`
- `src/assets/hero.png`, `react.svg`, `vite.svg` (unused Vite template files)
- From the page: custom cursor, grain, progress bar, industries marquee, the
  "Motion & visuals" reel strip and its lightbox, the hero "laptop assembles"
  animation, nav links and mobile menu, and the phone, budget and service fields
  in the contact form. The reference has none of these. LinkedIn and Behance
  moved to the footer.

## Section by section

| Reference | Yours now |
| --- | --- |
| Preloader with logo and counter | "HM." with a 0–100% counter tied to real loading |
| Nav: logo + quote button | Same |
| Hero video scrubbed by scroll, headline over it | Your Higgsfield video (or photo) scrubbed by scroll; copy lifts away, scene fades to black |
| Four stats | Your four stats, counting up |
| Mission statement | Pinned; words light up as you scroll |
| Pinned "the work" scene | "One designer. Every detail." over the work-scene video |
| Browser window of draggable sites | Your 11 projects; drag, throw, click to open (swipe row on phones) |
| Pinned closing scene | "Your project could be next." |
| Short contact form + copy-email | Name, email, "What are you building?", plus click-to-copy email |
| One-line footer with back-to-top | Same, plus LinkedIn and Behance |