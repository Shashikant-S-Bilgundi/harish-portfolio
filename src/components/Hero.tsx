import { SITE } from '../data/siteData';

/*
 * Opens on the closed laptop, small on the horizon. As you scroll, the camera
 * moves in while the lid opens, and each .hero__line appears inside the
 * screen in turn; then the camera pushes into the screen with the text inside
 * it. (SITE.heroTextAtStart shows the text above the closed laptop instead.)
 * The scroll moves the .hero__line wrappers; the load-in animation moves the
 * elements inside them, so the two never clash.
 */
export default function Hero() {
  return (
    <section className="scene hero" id="top" aria-labelledby="heroTitle">
      <canvas className="scene__canvas" id="heroCanvas" role="img" aria-label="A closed laptop on a violet horizon; scrolling opens it and moves the camera into its screen"></canvas>

      <div className="hero__copy">
        <div className="hero__line"><p className="eyebrow" data-intro="">{SITE.role}</p></div>
        <h1 className="display hero__title" id="heroTitle">
          <span className="mask hero__line"><span className="mask__in">Ideas in.</span></span>
          <span className="mask hero__line"><span className="mask__in">Experiences <em>out.</em></span></span>
        </h1>
        <div className="hero__line">
          <p className="lead hero__sub" data-intro="">
            I design cinematic websites, motion and brand identities that make people stop, look and get in touch.
          </p>
        </div>
        <div className="hero__line">
          <div className="hero__ctas" data-intro="">
            <a className="btn btn--primary" href="#contact">Get a quote →</a>
            <a className="btn btn--ghost" href="#work">See the work ↓</a>
          </div>
        </div>
      </div>
      <p className="hero__scroll hero__cue" aria-hidden="true">Scroll</p>
    </section>
  );
}