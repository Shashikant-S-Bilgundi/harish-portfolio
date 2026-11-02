export default function Nav() {
  return (
    <header className="nav" id="nav">
      <a className="nav__logo" href="#top" aria-label="Harish Moger, back to top">HM<span>.</span></a>
      <div className="nav__actions">
        {/* Your résumé, from public/Harish_Moger_Resume.pdf */}
        <a className="btn btn--ghost btn--sm" href={`${import.meta.env.BASE_URL}Harish_Moger_Resume.pdf`} download="Harish_Moger_Resume.pdf">
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
          </svg>
          Resume
        </a>
        <a className="btn btn--primary btn--sm" href="#contact">Get a quote</a>
      </div>
    </header>
  );
}