export default function ProjectModal() {
  return (
    <div className="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle" hidden>
      <div className="modal__backdrop" data-close=""></div>
      <div className="modal__panel">
        <button className="modal__close" type="button" data-close="" aria-label="Close project">✕</button>
        <div className="modal__view" id="mView" data-lenis-prevent="" tabIndex={0} aria-label="Full page preview, scrollable"></div>
        <div className="modal__info">
          <p className="eyebrow" id="mCat">Project</p>
          <h3 className="h3" id="mTitle">Project</h3>
          <p className="modal__summary" id="mSummary"></p>
          <ul className="modal__tags" id="mTags"></ul>
          <div className="modal__actions">
            <a className="btn btn--primary" id="mVisit" href="#" target="_blank" rel="noopener noreferrer">Open site ↗</a>
            <button className="btn btn--ghost" type="button" id="mNext">Next project</button>
          </div>
          <p className="modal__note">Full page preview. Scroll inside the window.</p>
        </div>
      </div>
    </div>
  );
}