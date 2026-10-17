export default function CtaScene() {
  return (
    <section className="cta scene" id="contact-scene" data-nav="contact" aria-label="Start a project">
      <div className="stage">
        <div className="stage__glow" aria-hidden="true"></div>
        <canvas className="stage__canvas" id="scene3" role="img" aria-label="Harish holds a laptop out toward you, smiles and opens it"></canvas>
        <p className="cta__caption h2" aria-hidden="true"><span className="cta__mask"><span className="cta__swap"><span>Got an idea?</span><span>Let&apos;s make it real.</span></span></span></p>
        <div className="cta__screen">
          <div className="cta__screen-inner">
            <p className="eyebrow">Start a project</p>
            <h2 className="h1">Your project could be <span className="grad">next.</span></h2>
            {/* [CONFIRM] add a reply time if you want, e.g. "within 48 hours" */}
            <p className="lead">Share your idea and I&apos;ll come back with a plan and a quote.</p>
            <span className="cta__down mono">The form is just below ↓</span>
          </div>
        </div>
      </div>
    </section>
  );
}