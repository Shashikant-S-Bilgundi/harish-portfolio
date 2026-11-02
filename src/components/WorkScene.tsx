import type { CSSProperties, ReactNode } from 'react';
import { SCENES, PROJECTS, SITE } from '../data/siteData';

/*
 * Second section. Your 360° video plays on the canvas (siteData `video`); the
 * elements float over it in 3D, as in the reference:
 *   while the camera turns — six dark app windows travel a full circle around
 *     you in step with the camera (preview, lens, icon palette, colour picker,
 *     services, assets)
 *   as it comes back to the front — two large see-through dashboards swing in
 *     (a gallery of your projects, and your live launches) behind the caption.
 * Without the video, your photo turns in 3D with the same elements around it.
 * Positions live in styles.css (the .p-… rules); motion lives in engine.ts.
 */
const scene = SCENES.find((s) => s.id === 'work');
const focus = scene?.motion?.focus ?? { x: 0.5, y: 0.35 };
const tint = (c: string) => ({ '--c': c }) as CSSProperties;
/** Your real screenshot (public/assets/work/<slug>/thumb.webp) when it exists; the mock-up shows until then. */
const Shot = ({ src }: { src: string }) => (
  <img className="ui-shot__img" src={src} alt="" loading="lazy" decoding="async" draggable={false}
    onError={(e) => { e.currentTarget.style.display = 'none'; }} />
);

const SERVICES: [string, string][] = [
  ['Strategy', '#A78BFA'], ['UI/UX design', '#F87171'], ['Web build', '#FACC15'], ['Motion', '#4ADE80'], ['Launch', '#FACC15'],
];
const GALLERY_TABS = ['All', 'Websites', 'Apps', 'Brand', 'Motion'];
const LIVE = PROJECTS.slice(0, 3);

/** A floating app window: title bar with three dots, then its content. */
function Win({ cls, title, late, children }: { cls: string; title?: string; late?: boolean; children: ReactNode }) {
  return (
    <div className={`panel ${cls}${late ? ' panel--late' : ''}`}>
      <div className="panel__in">
        {title !== undefined && (
          <div className="ui-bar">
            <span className="ui-dots"><i></i><i></i><i></i></span>
            <span className="ui-bar__title">{title}</span>
          </div>
        )}
        <div className="ui-body">{children}</div>
      </div>
    </div>
  );
}

const Icon = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

export default function WorkScene() {
  return (
    <section className="scene scene--orbit" id="work-scene" aria-label={`Behind the work: ${SITE.name} surrounded by design dashboards`}>
      <canvas className="scene__canvas" id="workCanvasScene" aria-hidden="true"></canvas>
      <div className="scene__dim" aria-hidden="true"></div>

      <div className="orbit" aria-hidden="true">
        <div className="orbit__world">
          <div className="orbit__photo">
            <img src={scene?.photo} alt="" draggable={false} style={{ objectPosition: `${focus.x * 100}% ${focus.y * 100}%` }} />
          </div>

          {/* ---- While the camera turns ---- */}
          <Win cls="p-preview" title="Preview">
            <div className="ui-split">
              <div className="ui-lines"><b></b><i></i><i></i><i className="is-short"></i><em className="ui-chip">Approve</em></div>
              <div className="ui-thumb ui-thumb--portrait"></div>
            </div>
          </Win>

          <Win cls="p-lens" title="Lens">
            <div className="ui-dial"><i></i></div>
            <div className="ui-slider"><i></i></div>
            <div className="ui-row-end"><em className="ui-chip">Apply</em></div>
          </Win>

          <Win cls="p-icons" title="">
            <div className="ui-icons">
              <span><Icon><circle cx="12" cy="12" r="8" /><path d="M8.5 12.2l2.3 2.3 4.7-4.9" /></Icon></span>
              <span><Icon><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" /><circle cx="12" cy="12" r="2.5" /></Icon></span>
              <span className="is-red"><Icon><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.6" fill="currentColor" /></Icon></span>
              <span><Icon><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></Icon></span>
              <span><Icon><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /></Icon></span>
              <span><Icon><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M10 5v14" /></Icon></span>
              <span className="ui-swatch ui-swatch--grad"></span>
              <span className="ui-swatch ui-swatch--violet"></span>
            </div>
          </Win>

          <Win cls="p-color" title="Colour">
            <div className="ui-gradient"><i></i></div>
            <div className="ui-hue"><i></i></div>
            <div className="ui-lines"><i></i><i className="is-short"></i></div>
          </Win>

          <Win cls="p-services" title="Project brief">
            <div className="ui-search">Search services</div>
            <div className="ui-cols">
              <div className="ui-copy">
                <p className="ui-heading">Selected services</p>
                <div className="ui-lines"><i></i><i></i><i className="is-short"></i></div>
                <p className="ui-sub">Timeline</p>
                <div className="ui-lines"><i></i><i className="is-short"></i></div>
              </div>
              <ul className="ui-list">
                {SERVICES.map(([label, c]) => <li key={label}><i style={tint(c)}></i>{label}</li>)}
              </ul>
            </div>
          </Win>

          <Win cls="p-media" title="Assets">
            <div className="ui-split">
              <div className="ui-thumbs2"><i className="ui-thumb ui-thumb--peach"></i><i className="ui-thumb ui-thumb--spectrum"></i></div>
              <div className="ui-lines"><b></b><i></i><i className="is-short"></i></div>
            </div>
          </Win>

          {/* ---- As the camera comes back to the front ---- */}
          <Win cls="p-gallery" late>
            <div className="ui-head">
              <p className="ui-heading ui-heading--lg">Selected work</p>
              <ul className="ui-tabs">{GALLERY_TABS.map((t, i) => <li key={t} className={i === 0 ? 'is-on' : undefined}>{t}</li>)}</ul>
            </div>
            <div className="ui-gallery">
              {PROJECTS.map((p) => (
                <figure className="ui-card" key={p.slug}>
                  <div className="ui-shot" style={tint(p.color)}><i></i><b></b><b className="is-short"></b><em></em><Shot src={p.thumb} /></div>
                  <figcaption><span>{p.name}</span><small>{p.category.split(' · ')[0]}</small></figcaption>
                </figure>
              ))}
              <figure className="ui-card ui-card--yours">
                <div className="ui-shot"><span>+</span></div>
                <figcaption><span>Your project</span><small>Next</small></figcaption>
              </figure>
            </div>
          </Win>

          <Win cls="p-cards" late>
            <div className="ui-head">
              <p className="ui-heading">Live launches</p>
              <em className="ui-chip">View all</em>
            </div>
            <div className="ui-cardrow">
              {LIVE.map((p) => (
                <div className="ui-mini" key={p.slug} style={tint(p.color)}>
                  <Shot src={p.thumb} />
                  <span>{p.name}</span>
                  <small><i></i>Live</small>
                </div>
              ))}
            </div>
          </Win>
        </div>
      </div>

      <div className="scene__shade" aria-hidden="true"></div>
      <div className="scene__caption">
        <p className="eyebrow">Behind every pixel</p>
        <h2 className="display">One designer.<br /><em>Every detail.</em></h2>
      </div>
      <div className="scene__fade" aria-hidden="true"></div>
    </section>
  );
}