export default function Work() {
  return (
    <section className="work" id="work" data-nav="work" aria-label="Selected work">
      <div className="container">
        <div className="browser glow" id="browser" data-reveal="">
          <div className="browser__bar">
            <div className="browser__dots" aria-hidden="true"><span></span><span></span><span></span></div>
            <div className="browser__arrows" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <svg viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div className="browser__address mono">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.4" /></svg>
              {/* [CONFIRM] your domain */}
              <span id="address">harishmoger.design/work</span>
            </div>
            <div className="browser__tabs" role="tablist" aria-label="Filter projects">
              <button className="tab is-active" role="tab" aria-selected="true" data-filter="all">All</button>
              <button className="tab" role="tab" aria-selected="false" data-filter="websites">Websites</button>
              <button className="tab" role="tab" aria-selected="false" data-filter="ecommerce">E-commerce</button>
              <button className="tab" role="tab" aria-selected="false" data-filter="apps">Apps</button>
            </div>
            <div className="browser__tools">
              <button className="tool" type="button" data-layout="tidy">Tidy up</button>
              <button className="tool" type="button" data-layout="scatter">Scatter</button>
              <button className="tool" type="button" id="listToggle" aria-pressed="false">View as list</button>
            </div>
          </div>
          {/* Filled by script.js; keep childless in React */}
          <div className="browser__canvas" id="workCanvas" data-cursor="Drag"></div>
          <ol className="browser__list" id="workList" hidden></ol>
        </div>
      </div>

      {/* Motion and creative posts in one strip */}
      <div className="strip" id="media">
        <div className="container strip__head">
          <p className="eyebrow" data-scramble="">Also in the toolkit</p>
          <h2 className="strip__title" data-split="">Motion &amp; <span className="grad">visuals.</span></h2>
          <p className="strip__note">Reels and social creatives. Tap any one to play or view it.</p>
        </div>
        <div className="strip__viewport"><div className="strip__track" id="stripTrack"></div></div>
      </div>
    </section>
  );
}