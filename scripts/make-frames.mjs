#!/usr/bin/env node
/* =========================================================
   Turn a Higgsfield video into the frames the scroll scenes play.

   npm run frames -- <scene> <desktop.mp4> [mobile.mp4] [frames]

     scene        hero | work | cta
     desktop.mp4  your 16:9 video, downloaded from Higgsfield
     mobile.mp4   optional 9:16 video. Without it, the middle of the
                  16:9 video is cropped to portrait for phones.
     frames       optional desktop frame count, as a plain number
                  (default 120; phones get two thirds). More frames =
                  smoother scrolling but a heavier page. A 360° orbit
                  looks best at around 200. `--frames 200` works too,
                  except in Windows PowerShell, which swallows the `--`.

   Example:  npm run frames -- work videos/orbit-16x9.mp4 200

   Writes public/assets/frames/<scene>/desktop/0001.webp …,
   public/assets/frames/<scene>/mobile/0001.webp … and manifest.json.
   The site picks them up automatically; no code changes needed.
   ========================================================= */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import ffmpegStatic from 'ffmpeg-static';

const SCENES = ['hero', 'work', 'cta'];
const DESKTOP = { frames: 120, maxWidth: 1600 };
const MOBILE = { frames: 80, maxHeight: 1280 };
const QUALITY = 72; // WebP quality, 0–100. Lower = smaller files.

// A bare whole number is the frame count. Windows PowerShell drops the `--`
// in `npm run frames -- …`, so npm then claims `--frames` for itself and
// passes only the number through; accepting the number keeps both forms working.
const args = process.argv.slice(2);
const pos = [];
let frameCount = DESKTOP.frames;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--frames') frameCount = Number(args[++i]);
  else if (args[i].startsWith('--frames=')) frameCount = Number(args[i].slice(9));
  else if (/^\d+$/.test(args[i]) && !existsSync(args[i])) frameCount = Number(args[i]);
  else pos.push(args[i]);
}
const [scene, desktopIn, mobileIn] = pos;
const ffmpeg = ffmpegStatic || 'ffmpeg';

function fail(msg, hint = '') {
  console.error(`\n✗ ${msg}\n`);
  if (hint) console.error(`${hint}\n`);
  console.error('Usage:   npm run frames -- <hero|work|cta> <desktop.mp4> [mobile.mp4] [frames]');
  console.error('Example: npm run frames -- work videos/orbit-16x9.mp4 200\n');
  process.exit(1);
}

/** Every .mp4 in videos/ and the project folder, to point at when a path is wrong. */
function videosNearby() {
  const found = [];
  for (const dir of ['videos', '.']) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) if (/\.mp4$/i.test(f)) found.push(dir === '.' ? f : `${dir}/${f}`);
  }
  return found;
}

function missingVideo(label, file) {
  const nearby = videosNearby();
  const lines = [`Looked for: ${resolve(file)}`];
  if (nearby.length) {
    lines.push('', 'Videos found in this project:', ...nearby.map((f) => `  ${f}`));
    lines.push('', `Use one of those names, e.g.  npm run frames -- ${scene} ${nearby[0]} 200`);
  } else if (!existsSync('videos')) {
    lines.push('', 'There is no "videos" folder here yet. Download your MP4 from Higgsfield,',
      `put it in ${resolve('videos')}, and run this again with its file name.`);
  } else {
    lines.push('', `The "videos" folder is empty. Download your MP4 from Higgsfield into`,
      `${resolve('videos')} and run this again with its file name.`);
  }
  fail(`Can't find the ${label} "${file}".`, lines.join('\n'));
}

if (!SCENES.includes(scene)) fail(`Scene must be one of: ${SCENES.join(', ')}.`);
if (!desktopIn) fail('Give the path to your video.');
if (!existsSync(desktopIn)) missingVideo('video', desktopIn);
if (mobileIn && !existsSync(mobileIn)) missingVideo('mobile video', mobileIn);
if (!Number.isInteger(frameCount) || frameCount < 10 || frameCount > 600) fail('The frame count must be a whole number from 10 to 600.');

function duration(file) {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-i', file], { encoding: 'utf8' });
  const m = /Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/.exec(r.stderr || '');
  if (!m) fail(`"${file}" doesn't look like a video ffmpeg can read.`);
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + parseFloat(m[3]);
}

function extract(file, dir, frames, size, crop) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const fps = Math.min(30, frames / duration(file));
  const filters = [crop, `fps=${fps.toFixed(4)}`, size].filter(Boolean).join(',');
  const run = (ext, codec) => spawnSync(ffmpeg, [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', file, '-vf', filters, '-an', ...codec, join(dir, `%04d.${ext}`),
  ], { stdio: 'inherit' });

  let ext = 'webp';
  let r = run(ext, ['-c:v', 'libwebp', '-quality', String(QUALITY), '-compression_level', '4']);
  if (r.status !== 0) { // ffmpeg without WebP support: fall back to JPEG
    ext = 'jpg';
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    r = run(ext, ['-q:v', '4']);
    if (r.status !== 0) fail(`ffmpeg couldn't convert "${file}".`);
  }
  const files = readdirSync(dir).filter((f) => f.endsWith(`.${ext}`));
  const bytes = files.reduce((n, f) => n + statSync(join(dir, f)).size, 0);
  return { count: files.length, ext, mb: bytes / 1048576 };
}

const out = resolve('public/assets/frames', scene);
console.log(`\nMaking frames for "${scene}"…`);

const desktop = extract(desktopIn, join(out, 'desktop'), frameCount,
  `scale='min(${DESKTOP.maxWidth},iw)':-2:flags=lanczos`);
const mobile = extract(mobileIn || desktopIn, join(out, 'mobile'), Math.round(frameCount * (MOBILE.frames / DESKTOP.frames)),
  `scale=-2:'min(${MOBILE.maxHeight},ih)':flags=lanczos`,
  mobileIn ? '' : "crop='min(iw,ih*9/16)':ih");

writeFileSync(join(out, 'manifest.json'), JSON.stringify({
  desktop: { count: desktop.count, ext: desktop.ext },
  mobile: { count: mobile.count, ext: mobile.ext },
  source: { desktop: desktopIn, mobile: mobileIn || `${desktopIn} (cropped)` },
}, null, 2));

console.log(`✓ desktop: ${desktop.count} frames, ${desktop.mb.toFixed(1)} MB`);
console.log(`✓ mobile:  ${mobile.count} frames, ${mobile.mb.toFixed(1)} MB${mobileIn ? '' : ' (cropped from the 16:9 video)'}`);
console.log(`✓ written to public/assets/frames/${scene}/\n  Run "npm run dev" and scroll: the ${scene} scene now plays your video.\n`);
