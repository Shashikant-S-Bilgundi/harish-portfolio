# Higgsfield videos for the scroll scenes

The site has three full-screen scenes that play frame by frame as visitors scroll.
Each one already works without a video. A Higgsfield video only replaces the
built-in version if you want real footage:

| Scene | Built in today | Video replaces it with |
| --- | --- | --- |
| **hero** (top) | drawn laptop; the camera pushes into its screen | a filmed laptop push-in |
| **work** ("One designer. Every detail.") | your photo, `src/assets/heroimage.jpeg`, turning in 3D with dashboards around it | a filmed 360° orbit around you, dashboards and all |
| **cta** ("Your project could be next.") | drawn laptop that opens, shows your projects, closes | a filmed version |

## Before you start

When checked on 23 Oct 2026, your Higgsfield workspace was on the free plan with
0 credits, so add credits or a plan first. Generating happens on the Higgsfield
site; the connector in Claude can read your history but can't start a video.

## Settings

- **Model:** Cinema Studio Video 3.0
- **Duration:** 8 seconds · **Resolution:** 1080p · **Audio:** off
- **Aspect ratio:** 16:9 for desktop. A 9:16 version for phones is optional;
  without it, the frames command crops the middle of the 16:9 video.
- **Start image:** none for the two laptop scenes (text-to-video). For the
  work scene, use `src/assets/heroimage.jpeg`.

## What makes a video scroll well

Scrolling steps through the video one frame at a time, so:

- **One unbroken shot.** A cut becomes a jump in the middle of the scroll.
- **Slow camera, small movements.** Fast motion stutters when scrubbed.
- **Steady light.** Flicker shows up as flashing.
- **A darker last second.** Each scene fades to black at the end, so a dark
  ending blends straight into the next section.

## Prompts

### 1. Hero: laptop push-in

> A dark matte-black laptop with a thin silver edge sits open on a glossy black
> surface in a dark studio. Its screen is off and reflects a soft diagonal glare.
> Behind it, a thin horizontal strip of violet light glows along the horizon.
> Slow, smooth dolly-in straight toward the screen until the black screen fills
> the entire frame. One unbroken shot, no cuts, no camera shake, no people, no text.

The headline sits on top of this video, so keep it dark: no bright screen content.

### 2. Work scene: a 360° orbit around you

This shot has its own settings, because a full turn has to end exactly where it
starts and keep your face consistent all the way round:

- **Model:** Cinema Studio 4.0, in the mode that accepts images (`omni_reference`).
  If your face drifts on the far side, try Kling 3.0 with a start and end frame.
- **Start image *and* end image:** `src/assets/heroimage.jpeg`, the same photo
  for both, so the orbit closes into a clean 360°.
- **Image reference:** `heroimage.jpeg` again, to hold your identity round the back.
- **Duration:** 15 seconds. Longer means more distinct frames, so smoother scrolling.
- **Resolution** 1080p · **Aspect ratio** 16:9 · **Audio** off

> Starting from this exact shot, the camera makes one smooth, continuous
> 360-degree orbit around the person at a constant speed and ends on this exact
> shot again. The person stays still and calm. Floating translucent glass UI
> dashboards (a colour picker, design tool panels, small analytics cards and a
> large panel with a grid of website thumbnails) hang in the air around them at
> different depths and stay fixed in place as the camera circles past. Dark room
> at night, soft violet light, the face gently lit. One unbroken shot, no cuts,
> no speed changes, no camera shake, no text.

Then make the frames with extra frames for the full turn:

```bash
npm run frames -- work videos/orbit-16x9.mp4 --frames 200
```

While this video is in place, the site hides its own 3D photo and dashboards
(the ones in the video take over, as in the reference) and gives the section a
longer scroll (`videoLength` in `src/data/siteData.ts`). Before using a result,
check that its last second matches its first and that your face holds up on the
far side: inventing the back of you and the room is the hardest part of this
shot for every model, so it can take a couple of tries.

### 3. Closing scene: laptop opens and closes

> A closed dark laptop rests on a glossy black surface in front of a thin violet
> light strip on the horizon. The lid slowly opens; the screen lights up with a
> grid of colourful website thumbnails, holds for a moment, then the lid slowly
> closes again. Locked-off camera, one unbroken shot, no cuts, no people, no text.

## Turn a video into frames

1. Download the MP4s into a `videos/` folder in this project (it's git-ignored).
2. Run one command per scene:

   ```bash
   npm install          # once; includes ffmpeg, nothing else to install
   npm run frames -- hero videos/hero-16x9.mp4 videos/hero-9x16.mp4
   npm run frames -- work videos/orbit-16x9.mp4 --frames 200
   npm run frames -- cta  videos/cta-16x9.mp4
   ```

3. Run `npm run dev` and scroll. The scene switches to the video by itself.

Frames land in `public/assets/frames/<scene>/` with a `manifest.json`. To go back
to the built-in version of a scene, delete that scene's folder.

## Tuning

- **Scene speed:** `length` for each entry in `SCENES` in `src/data/siteData.ts`
  (scroll distance in % of the screen height; lower is faster).
- **Frame count, size and quality:** the constants at the top of
  `scripts/make-frames.mjs` (120 desktop frames at up to 1600 px wide, 80 mobile
  frames, WebP quality 72). Real footage usually comes to several MB per scene;
  the site loads frames coarse-to-fine, so scrolling works before they've all
  arrived. Lower `QUALITY` or the frame counts if pages feel heavy.