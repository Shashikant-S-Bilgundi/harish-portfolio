export default function CtaScene() {
  return (
    <section className="scene scene--laptop" id="cta-scene" aria-label="Start a project">
      <canvas className="scene__canvas" id="ctaCanvas" role="img" aria-label="A laptop opens, shows a gallery of projects, then closes"></canvas>
      <div className="scene__caption">
        <p className="eyebrow">Start a project</p>
        <h2 className="display">Your project could be <em>next.</em></h2>
      </div>
      <div className="scene__fade" aria-hidden="true"></div>
    </section>
  );
}