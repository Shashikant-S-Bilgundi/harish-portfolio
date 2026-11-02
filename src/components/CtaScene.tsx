/*
 * Closing scene. With your video (siteData `video` on the cta scene): you lift
 * a laptop, open it and push it toward the camera until the screen fills the
 * view, then it glows white, greys and goes dark. Without it, a drawn laptop
 * opens and closes. Motion lives in engine.ts.
 */
export default function CtaScene() {
  return (
    <section className="scene scene--laptop" id="cta-scene" aria-label="Start a project">
      <canvas className="scene__canvas" id="ctaCanvas" role="img" aria-label="Harish lifts a laptop, opens it and holds it out toward you"></canvas>
      <div className="scene__shade" aria-hidden="true"></div>
      <div className="scene__caption">
        <h2 className="display">Your project could be <em>next.</em></h2>
      </div>
      <div className="scene__fade" aria-hidden="true"></div>
    </section>
  );
}