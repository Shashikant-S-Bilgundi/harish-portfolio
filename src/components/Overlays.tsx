// Matches the reference modal: close button, project name, "Open site" link and a
// scrollable full-page screenshot. Removed: category, role, summary, tags,
// live-preview and next buttons, and the media lightbox.
export default function Overlays() {
  return (
    <div className="preview preview--min" id="preview" role="dialog" aria-modal="true" aria-labelledby="pvTitle" hidden>
      <div className="preview__backdrop" data-close=""></div>
      <div className="preview__panel">
        <div className="preview__grip" aria-hidden="true"></div>
        <div className="preview__top">
          <h3 className="h3" id="pvTitle">Project</h3>
          <a className="btn btn--primary btn--sm" id="pvVisit" href="#" target="_blank" rel="noopener noreferrer"><span className="btn__label">Open site ↗</span></a>
          <button className="preview__close" type="button" data-close="" aria-label="Close preview">✕</button>
        </div>
        <p className="preview__caption mono">Full page preview</p>
        <div className="preview__view" id="pvView" data-lenis-prevent=""></div>
      </div>
    </div>
  );
}