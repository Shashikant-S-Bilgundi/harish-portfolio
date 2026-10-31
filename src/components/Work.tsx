import { SITE } from '../data/siteData';

export default function Work() {
  return (
    <section className="work" id="work" aria-labelledby="workTitle">
      <div className="container">
        <header className="work__head">
          <p className="eyebrow">Selected work</p>
          <h2 className="h2" id="workTitle">Real brands. <em>Real launches.</em></h2>
          <p className="work__hint">Drag the cards, toss them around, open any one.</p>
        </header>

        <div className="window">
          <div className="window__bar">
            <span className="window__dots" aria-hidden="true"><i></i><i></i><i></i></span>
            <span className="window__address" id="address">{SITE.workAddress}</span>
          </div>
          {/* Cards are built by the engine from PROJECTS in siteData.ts */}
          <div className="window__canvas" id="workPile"></div>
        </div>
      </div>
    </section>
  );
}