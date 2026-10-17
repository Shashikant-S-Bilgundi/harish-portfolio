export default function Overlays() {
  return (
    <>
      <div className="preview" id="preview" role="dialog" aria-modal="true" aria-labelledby="pvTitle" hidden>
        <div className="preview__backdrop" data-close=""></div>
        <div className="preview__panel">
          <div className="preview__grip" aria-hidden="true"></div>
          <div className="preview__view" id="pvView" data-lenis-prevent=""></div>
          <div className="preview__info" data-lenis-prevent="">
            <button className="preview__close" type="button" data-close="" aria-label="Close preview">×</button>
            <p className="eyebrow" id="pvCat"></p>
            <h3 className="h3" id="pvTitle"></h3>
            <p className="preview__role mono" id="pvRole"></p>
            <p id="pvSummary"></p>
            <ul className="tags" id="pvTags"></ul>
            <div className="preview__actions">
              <a className="btn btn--primary" id="pvVisit" href="#" target="_blank" rel="noopener noreferrer"><span className="btn__label">Visit live site ↗</span></a>
              <button className="btn btn--ghost" id="pvLive" type="button"><span className="btn__label">Try live preview</span></button>
              <button className="btn btn--ghost" id="pvNext" type="button"><span className="btn__label">Next project →</span></button>
            </div>
          </div>
        </div>
      </div>

      <div className="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Media viewer" hidden>
        <div className="lightbox__backdrop" data-close=""></div>
        <div className="lightbox__body" id="lbBody"></div>
        <button className="lightbox__close" type="button" data-close="" aria-label="Close">×</button>
      </div>
    </>
  );
}