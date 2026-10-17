import Arrow from './Arrow';

export default function Hero() {
  return (
    <section className="hero scene" id="top" aria-label="Introduction">
      <div className="stage">
        <div className="stage__glow" aria-hidden="true"></div>
        <canvas className="stage__canvas" id="scene1" role="img" aria-label="A silver laptop slides into a dark violet studio and the website assembles on its screen"></canvas>

        <div className="hero__intro" aria-hidden="true">
          <p className="mega hero__intro-title">
            <span className="line"><span className="w">Ideas</span> <span className="w">in.</span></span>
            <span className="line"><span className="w grad">Experiences</span> <span className="w grad">out.</span></span>
          </p>
        </div>
        <div className="hero__hint" aria-hidden="true">
          <span className="mono">Scroll to build</span><span className="hero__line"></span><span className="mono hero__count">0%</span>
        </div>

        <div className="hero__ui" id="heroUI">
          <div className="hero__frame" aria-hidden="true"></div>

          <div className="hero__nav hero__piece" data-piece="" data-from="0,-320,-4" aria-hidden="true">
            <div className="navbar glass">
              <span className="logo">HM</span>
              <span className="navbar__links"><span>Work</span><span>About</span><span>Contact</span></span>
              <span className="btn btn--primary btn--sm navbar__cta"><span className="btn__label">Get a quote</span></span>
              <span className="navbar__menu">Menu</span>
            </div>
          </div>

          <div className="hero__layout">
            <div className="hero__main">
              <p className="eyebrow hero__piece" data-piece="" data-desktop-only="" data-from="-760,-60,-6">Harish Moger — UI/UX &amp; Multimedia Designer</p>
              <h1 className="h1 hero__title hero__piece" data-piece="" data-from="-1100,140,5"><span className="line">Ideas in.</span><span className="line grad">Experiences out.</span></h1>
              <p className="lead hero__sub hero__piece" data-piece="" data-desktop-only="" data-from="-820,520,-3">I design cinematic websites, motion and brand identities that make people stop, look and get in touch.</p>
              <div className="hero__ctas hero__piece" data-piece="" data-from="240,760,7">
                <a className="btn btn--primary magnetic" href="#contact"><span className="btn__label">Get a quote</span><Arrow /></a>
                <a className="btn btn--ghost magnetic" href="#work"><span className="btn__label">See the work</span></a>
              </div>
              {/* [CONFIRM] availability wording */}
              <p className="hero__meta mono"><span>Web · Motion · Brand</span><i className="live-dot" aria-hidden="true"></i><span>Booking new projects</span></p>
            </div>
            <div className="hero__side">
              <div className="avatar-chip glass hero__piece" data-piece="" data-from="980,-240,9">
                <img src="assets/img/harish.jpg" alt="Harish Moger" data-fallback="HM" width="52" height="52" />
                <div><strong>Harish Moger</strong><span><i className="live-dot" aria-hidden="true"></i>Available for projects</span></div>
              </div>
              {/* Filled by script.js; keep childless in React */}
              <div className="hero__thumbs hero__piece" id="heroThumbs" data-piece="" data-desktop-only="" data-from="1100,420,-8" aria-hidden="true"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}