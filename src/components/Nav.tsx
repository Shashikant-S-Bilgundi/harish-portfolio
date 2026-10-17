export default function Nav() {
  return (
    <>
      <header className="nav" id="nav">
        <div className="navbar glass">
          <a className="logo" href="#top" aria-label="Harish Moger, back to top">HM</a>
          <nav className="navbar__links" aria-label="Primary">
            <a href="#work" data-link="work">Work</a>
            <a href="#mission" data-link="about">About</a>
            <a href="#contact" data-link="contact">Contact</a>
            <span className="navbar__indicator" aria-hidden="true"></span>
          </nav>
          <a className="btn btn--primary btn--sm magnetic navbar__cta" href="#contact"><span className="btn__label">Get a quote</span></a>
          <button className="navbar__menu" type="button" aria-expanded="false" aria-controls="menu">Menu</button>
        </div>
      </header>

      <div className="menu" id="menu" hidden>
        <nav className="menu__nav" aria-label="Mobile">
          <a className="menu__link" href="#work"><span>Work</span></a>
          <a className="menu__link" href="#mission"><span>About</span></a>
          <a className="menu__link" href="#contact"><span>Contact</span></a>
        </nav>
        <a className="btn btn--primary" href="#contact"><span className="btn__label">Get a quote</span></a>
      </div>
    </>
  );
}