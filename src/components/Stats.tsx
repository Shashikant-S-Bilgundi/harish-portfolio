export default function Stats() {
  return (
    <section className="stats" id="stats" aria-label="Highlights">
      <div className="container">
        <div className="stats__band glass glow" data-reveal="">
          {/* Filled by script.js; keep childless in React */}
          <ul className="stats__list" id="statsList"></ul>
        </div>
      </div>
      <div className="marquee" aria-hidden="true"><div className="marquee__track" id="industryTrack"></div></div>
      <p className="sr-only">Industries served: real estate, mobility, e-commerce, wellness, packaging, ed-tech, digital marketing and lifestyle studios.</p>
    </section>
  );
}