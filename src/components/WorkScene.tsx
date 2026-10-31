import type { CSSProperties } from 'react';
import { SCENES, PROJECTS, SITE } from '../data/siteData';

/*
 * Second section: your photo turns in 3D while design dashboards float around
 * it at different depths. The engine rotates .orbit__world as you scroll, so
 * the photo and every panel move together with real perspective.
 */
const scene = SCENES.find((s) => s.id === 'work');
const focus = scene?.motion?.focus ?? { x: 0.5, y: 0.35 };
const tint = (c: string) => ({ '--c': c }) as CSSProperties;

const SWATCHES = ['#07060B', '#7C3AED', '#A78BFA', '#C4B5FD', '#F3F1F7'];
const LAYERS = ['Hero', 'Navigation', 'Work grid', 'Contact form'];
const ICONS = ['◆', '○', '△', '▢', '✦', '☰'];

export default function WorkScene() {
  return (
    <section className="scene scene--orbit" id="work-scene" aria-label={`Behind the work: ${SITE.name} surrounded by design dashboards`}>
      <canvas className="scene__canvas" id="workCanvasScene" aria-hidden="true"></canvas>

      <div className="orbit" aria-hidden="true">
        <div className="orbit__world">
          <div className="orbit__photo">
            <img src={scene?.photo} alt="" draggable={false} style={{ objectPosition: `${focus.x * 100}% ${focus.y * 100}%` }} />
          </div>

          <div className="panel p-color"><div className="panel__in">
            <p className="ui-title">Colour</p>
            <div className="ui-spectrum"><i></i></div>
            <div className="ui-hue"><i></i></div>
            <div className="ui-swatches">{SWATCHES.map((c) => <i key={c} style={tint(c)}></i>)}</div>
            <p className="ui-meta">#7C3AED · 100%</p>
          </div></div>

          <div className="panel p-type"><div className="panel__in">
            <p className="ui-title">Typography</p>
            <p className="ui-aa">Aa</p>
            <ul className="ui-rows">
              <li><span>Display</span><b>96</b></li>
              <li><span>Heading</span><b>48</b></li>
              <li><span>Body</span><b>18</b></li>
            </ul>
          </div></div>

          <div className="panel p-layers"><div className="panel__in">
            <p className="ui-title">Layers</p>
            <ul className="ui-layers">
              {LAYERS.map((l, i) => <li key={l} className={i === 0 ? 'is-on' : undefined}><i></i>{l}<b></b></li>)}
            </ul>
          </div></div>

          <div className="panel p-motion"><div className="panel__in">
            <p className="ui-title">Motion</p>
            <svg className="ui-curve" viewBox="0 0 100 60" preserveAspectRatio="none">
              <path className="ui-curve__grid" d="M0 15H100M0 30H100M0 45H100M25 0V60M50 0V60M75 0V60" />
              <path className="ui-curve__line" d="M4 56 C 38 56, 30 4, 96 4" />
              <circle cx="4" cy="56" r="2.6" /><circle cx="96" cy="4" r="2.6" />
            </svg>
            <p className="ui-meta">ease-out · 0.8s</p>
          </div></div>

          <div className="panel p-icons"><div className="panel__in">
            <div className="ui-icons">{ICONS.map((g) => <span key={g}>{g}</span>)}</div>
          </div></div>

          <div className="panel p-media"><div className="panel__in">
            <p className="ui-title">Assets</p>
            <div className="ui-thumbs">{PROJECTS.slice(4, 8).map((p) => <i key={p.slug} style={tint(p.color)}></i>)}</div>
          </div></div>

          <div className="panel p-projects"><div className="panel__in">
            <div className="ui-head">
              <p className="ui-title">Projects</p>
              <ul className="ui-tabs"><li className="is-on">All</li><li>Web</li><li>App</li><li>Brand</li></ul>
            </div>
            <div className="ui-grid">
              {PROJECTS.slice(0, 6).map((p) => (
                <div className="ui-tile" key={p.slug} style={tint(p.color)}>
                  <span>{p.name}</span>
                  <small>{p.category.split(' · ')[0]}</small>
                </div>
              ))}
            </div>
          </div></div>
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