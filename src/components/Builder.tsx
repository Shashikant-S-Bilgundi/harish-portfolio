export default function Builder() {
  return (
    <section className="builder scene" id="builder" data-nav="work" aria-label="Behind the work">
      <div className="stage">
        <div className="stage__glow" aria-hidden="true"></div>
        <canvas className="stage__canvas" id="scene2" role="img" aria-label="Harish works at his desk surrounded by floating design tools; the camera orbits to reveal his screen"></canvas>
        <div className="builder__caption">
          <p className="eyebrow">Behind every pixel</p>
          <p className="h2">One designer.<br />Every detail.</p>
        </div>
        <div className="builder__reveal">
          <p className="eyebrow">Selected work</p>
          <h2 className="mega"><span className="line">Real brands.</span><span className="line grad">Real launches.</span></h2>
          <p className="lead">Drag the cards, toss them around, open any one.</p>
        </div>
      </div>
    </section>
  );
}