import { useMemo, useRef, useState } from 'react';
import DepthCarousel from './DepthCarousel';
import SoundToggle from './SoundToggle';
import { REELS } from '../data/siteData';
import { useOnScreen } from '../lib/useOnScreen';

/* 9:16 videos in the depth carousel. Edit the list in siteData.ts (REELS). */
const MIN_CARDS = 5; // shorter lists repeat so the stack looks full; the counter counts real reels
const pad = (n: number): string => String(n).padStart(2, '0');

export default function ReelsSection() {
  const ref = useRef<HTMLElement>(null);
  const onScreen = useOnScreen(ref, '-10% 0px');
  const [muted, setMuted] = useState(true);
  const [active, setActive] = useState(0);
  const n = REELS.length;
  const cards = useMemo(() => {
    const reps = n ? Math.max(1, Math.ceil(MIN_CARDS / n)) : 0;
    return Array.from({ length: n * reps }, (_, k) => REELS[k % n]).map((r) => ({ image: r.poster, video: r.video, alt: r.title }));
  }, [n]);
  if (!n) return null;
  const current = REELS[active % n];
  return (
    <section className="showcase showcase--reels" ref={ref} aria-labelledby="reelsTitle">
      <header className="container showcase__head">
        <p className="eyebrow">Reels &amp; shorts</p>
        <h2 className="h2" id="reelsTitle">Made for the <em>scroll.</em></h2>
        <SoundToggle muted={muted} onToggle={() => setMuted((m) => !m)} />
      </header>
      <div className="showcase__depth">
        <DepthCarousel
          items={cards}
          cardWidth={270}
          cardHeight={480}
          radius={18}
          tint="#07060B"
          depth={220}
          spread={90}
          tilt={22}
          tiltDirection="right"
          perspective={1400}
          visibleCards={4}
          falloff={0.2}
          blur={6}
          loop
          showIndicators={cards.length === n}
          muted={muted}
          playing={onScreen}
          onChange={(i) => setActive(i)}
        />
      </div>
      <div className="showcase__meta" key={active} aria-live="polite">
        <p className="showcase__title">{current.title}</p>
        {current.caption && <p className="showcase__sub">{current.caption}</p>}
        <p className="showcase__count">{pad((active % n) + 1)} / {pad(n)}</p>
      </div>
    </section>
  );
}