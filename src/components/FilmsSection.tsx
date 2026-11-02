import { useRef, useState } from 'react';
import PrismCarousel from './PrismCarousel';
import SoundToggle from './SoundToggle';
import { FILMS } from '../data/siteData';
import { useOnScreen } from '../lib/useOnScreen';

/* 16:9 videos in the prism carousel. Edit the list in siteData.ts (FILMS). */
export default function FilmsSection() {
  const ref = useRef<HTMLElement>(null);
  const onScreen = useOnScreen(ref, '-10% 0px');
  const [muted, setMuted] = useState(true);
  if (!FILMS.length) return null;
  return (
    <section className="showcase" id="motion" ref={ref} aria-labelledby="filmsTitle">
      <header className="container showcase__head">
        <p className="eyebrow">Motion &amp; visuals</p>
        <h2 className="h2" id="filmsTitle">Stories that <em>move.</em></h2>
        <SoundToggle muted={muted} onToggle={() => setMuted((m) => !m)} />
      </header>
      <PrismCarousel
        items={FILMS.map((f) => ({ title: f.title, caption: f.caption, image: f.poster, video: f.video, embed: f.embed, source: f.source }))}
        muted={muted}
        playing={onScreen}
        label="Motion and visuals: 16:9 videos"
      />
    </section>
  );
}