import { SITE } from '../data/siteData';

export default function Hero() {
  return (
    <section className="scene hero" id="top" aria-labelledby="heroTitle">
      <canvas className="scene__canvas" id="heroCanvas" role="img" aria-label="A laptop in a dark studio; scrolling moves the camera into its screen"></canvas>

      <div className="hero__copy">
        <p className="eyebrow" data-intro="">{SITE.role}</p>
        <h1 className="display hero__title" id="heroTitle">
          <span className="mask"><span className="mask__in">Ideas in.</span></span>
          <span className="mask"><span className="mask__in">Experiences <em>out.</em></span></span>
        </h1>
        <p className="lead hero__sub" data-intro="">
          I design cinematic websites, motion and brand identities that make people stop, look and get in touch.
        </p>
        <div className="hero__ctas" data-intro="">
          <a className="btn btn--primary" href="#contact">Get a quote →</a>
          <a className="btn btn--ghost" href="#work">See the work ↓</a>
        </div>
        <p className="hero__scroll" data-intro="" aria-hidden="true">Scroll</p>
      </div>
    </section>
  );
}