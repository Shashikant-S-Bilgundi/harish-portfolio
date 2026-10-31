// Matches the reference: a pinned scene with a short caption ("The work"),
// which hands over to the "Featured work" heading right above the browser window.
export default function Builder() {
  return (
    <section className="builder scene" id="builder" aria-label="Behind the work">
      <div className="stage">
        <div className="stage__glow" aria-hidden="true"></div>
        <canvas className="stage__canvas" id="scene2" role="img" aria-label="Harish works at his desk; the camera orbits to reveal his screen"></canvas>
        <div className="builder__caption">
          <p className="eyebrow">The work</p>
          <h2 className="h2">One designer. <em>Every detail.</em></h2>
        </div>
        <div className="builder__reveal">
          <p className="eyebrow">Featured work</p>
          <h2 className="mega"><span className="line">Five live sites.</span><span className="line"><em>Take them for a spin.</em></span></h2>
          <p className="lead">Drag the cards, toss them around, open any one.</p>
        </div>
      </div>
    </section>
  );
}