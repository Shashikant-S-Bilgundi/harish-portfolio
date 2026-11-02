# What changed

## Round 16

- **Your videos in both carousels:** five 16:9 videos in Motion & visuals and
  five 9:16 videos in Reels & shorts, replacing the stand-ins and the LinkedIn
  embed. Titles come from the file names; edit them in `FILMS` and `REELS`.
- **Experience: 3.5 years.** The count-up now handles decimals (it rounded
  to whole numbers before, so 3.5 would have ended on 4).
- **Resume download** in the header, before "Get a quote", serving
  `public/Harish_Moger_Resume.pdf`.
- The reels carousel shows five real cards and five dots (it no longer repeats
  lists of five).

## Round 15

- **Your LinkedIn video is first in the 16:9 carousel.** Carousel items can
  now be an `embed` link (the `src` from an embed code) as well as a video
  file. The LinkedIn player loads only once its card is in the centre and the
  section is on screen, and is removed when you move to another video (which
  also stops it). It plays in LinkedIn's own player, so the visitor starts it,
  and the section's sound button doesn't apply to it.
- Until it has a still (`poster`), its side card shows a placeholder with a
  play icon and "LinkedIn video".

## Round 14

- **Two video carousels after "Selected work":**
  - *Motion & visuals* (16:9, `FILMS`): a prism-style coverflow written for
    this site, matching your recording. The centre video plays in colour;
    the others sit as greyscale cards, strips and slivers. Moving sweeps
    colour in with a rainbow band on its edge. Title, subtitle, previous and
    next buttons, and a counter sit underneath. Click, drag, arrow keys or
    a sideways swipe to move.
  - *Reels & shorts* (9:16, `REELS`): React Bits' Depth Carousel (from the
    source you sent), converted to TypeScript. Its front card plays its video,
    and only sideways swipes turn it, so the page still scrolls over it.
- Only the centre or front video loads and plays; it pauses when scrolled away.
  Videos start muted, with a sound button per section. Stills for the side
  cards come from your Cloudinary links automatically.
- Both lists start with your two existing videos as stand-ins; short lists
  repeat so the row looks full, while the counter counts real videos.

## Round 13

- **Project images** from your Cloudinary links, on the work cards, in the
  project popup and in the second section's gallery and launches cards. Each
  place asks Cloudinary for a resized, compressed copy (`f_auto,q_auto`, 800px
  for cards, 1800px for the popup) instead of the full-size original.
- **Popup:** a tall full-page screenshot scrolls as before; a shorter image,
  like a 16:9 hero, shows whole and centred over a blurred copy of itself.
- The second section's gallery and launches cards are now landscape (4:3),
  so more of each website shows.

## Round 12

- **Closing scene: the video is shorter on screen.** It starts at 82% of the
  screen height, centred below the nav with soft edges, so your head isn't cut
  off; it grows to fill the screen as the laptop comes toward the camera.
  Adjust with `inset` on the cta scene's `video` in siteData.ts.
- **360° section uses your watermark-free video** (same timing).
- **More space between words** in the large headings; the font's tight letter
  spacing was squeezing the spaces too.
- **Stats:** 4 years of experience; projects featured is now 7.
- **Project modal fixed:** cards you had dragged could show on top of the open
  modal. Their stacking now stays inside the work window.
- **Projects:** only Novara Nature Estates, SkyUp Digital Solutions, Midori,
  AbhiCabs, The Vector Graphics, Invensis Learning and Astromudra, with new
  links for Invensis Learning and Astromudra; the card pile is laid out for seven.

## Round 11

- **Closing scene uses your video** from Cloudinary, staged like the reference:
  you lift a laptop, open it and push it toward the camera until the screen
  fills the view (0–6.55 s of the video, over the first two-thirds of the
  scroll). "Your project could be next." fades in as one centred line as you
  lift it. Then the full screen blurs and washes out to near-white, drops to
  grey with dark edges while the caption fades, and goes dark.
- Played as Cloudinary frames like the second section (120 desktop, 80 phones).
  If the video can't load, the drawn laptop comes back.
- **Contact restyled like the reference:** a huge two-line heading over a
  violet glow, then the form in a glass card with filled fields, placeholders,
  purple labels and a full-width gradient button.

## Round 10

- **Hero opens on the scene from your reference image:** a closed laptop small
  on the horizon, a bright lavender light strip with a tall violet glow above
  it, a glossy floor with the laptop's reflection. The backdrop's colours are
  taken from the image itself. The laptop is an original design.
- As you scroll, the camera moves in while the lid opens and the screen lights
  up; your text lines appear inside the screen one after another; then the
  camera pushes into the screen as before.
- The "Scroll" cue sits at the bottom of the opening shot and fades as you start.
- Setting `heroTextAtStart` in siteData.ts: `false` (default) opens on the
  laptop alone; `true` shows the text above the closed laptop and drops it in.

## Round 9

- **A light dim on the second section's video** (about 20% darker, a little more
  at the edges), so the windows and caption sit into it while the video stays
  clearly visible. Adjust with `--dim` on `.scene__dim` in styles.css
  (0 = none, 0.22 = default, 0.4 = darker).

## Round 8

- **Hero: the laptop starts closed.** As you scroll, the lid opens and the
  screen lights up, then each line of the hero text (eyebrow, both headline
  lines, the sentence, the buttons) drops into the screen in turn. The camera
  then pushes into the screen and the text grows with it until the screen fills
  the view, and the page moves on. The hero scroll is longer to fit the opening.
- **Second section: the windows go all the way round.** Each of the six windows
  travels a full circle around you in step with your video's camera, bigger on
  the camera's side and smaller round the back. A window fades only while it
  would cover you, and turns slightly to face the camera so it never shows its
  back. Starting positions are `--a` in styles.css.
- **Second section: the video plays clear.** The violet tint, the dark edges and
  the darkening behind the caption are gone; the caption has its own shadow
  instead. Only the fade into the next section remains.

## Round 7

- **The second section's floating elements rebuilt to match the reference.**
  While the camera turns: six dark app windows modelled on the reference's
  (preview, lens dial, icon palette, colour picker, a services panel and an
  assets panel), held together as one cluster around you that leans with the
  camera. As the camera returns to the front: a tall see-through "Selected
  work" gallery (your 11 projects + a "Your project" tile) swings in on the
  right and a "Live launches" panel on the left, behind the caption, while the
  small windows dim.
- They replace the purple design-tool panels on a ring, which disappeared
  whenever they swung to the camera's side.
- The gallery and launch cards show your real screenshots from
  `public/assets/work/<slug>/thumb.webp` once you add them; mock-ups until then.
- Phones: four small windows in the corners, then the gallery behind the caption.

## Round 6

- **Your 360° video in the second section,** played from your Cloudinary link.
  The site requests single frames from Cloudinary (160 on desktop, 100 on
  phones) instead of seeking through the MP4, which only has keyframes every
  ~4 s and would stutter. Fallbacks: the MP4 itself, then your photo.
- The scroll plays 2.3–9.9 s of the video, skipping the still opening, so the
  turn starts as the section pins and ends facing you for the caption.
- **Dashboards orbit with the camera.** They sit on a ring around you and turn
  by the camera angle measured from your video, so they move with the room.
  Each shows only while it's behind you and hides while it passes behind your
  body. New "Spacing" panel. The Projects board comes in front at the end.
- Violet grade over the video to match the reference's darker look.

## Round 4

- **Ready for a 360° Higgsfield orbit in the second section.** When its frames
  are added, the video takes over the whole scene (the 3D photo and dashboards
  step aside, since the video has its own), and the section scrolls longer.
- **Smoother video scenes everywhere:** between two frames the site now blends
  them, so slow scrolling never steps.
- `npm run frames` takes a frame count as a plain number at the end (200 suits a
  360° turn). This works in Windows PowerShell, which swallows `--` and broke
  `--frames`. A wrong video path now shows where it looked and lists the videos
  it can find.
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