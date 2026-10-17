export default function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="container footer__grid">
        <div data-reveal="">
          <p className="eyebrow">Navigate</p>
          <ul><li><a href="#work">Work</a></li><li><a href="#mission">About</a></li><li><a href="#contact">Contact</a></li></ul>
        </div>
        <div data-reveal="">
          <p className="eyebrow">Connect</p>
          {/* [CONFIRM] add Dribbble and Instagram once you have the handles */}
          <ul>
            <li><a href="https://www.linkedin.com/in/harish-moger-97531618b/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></li>
            <li><a href="https://www.behance.net/harishmoger2" target="_blank" rel="noopener noreferrer">Behance ↗</a></li>
          </ul>
        </div>
        <div data-reveal="">
          <p className="eyebrow">Contact</p>
          <ul><li><a href="mailto:harishmoger03@gmail.com">harishmoger03@gmail.com</a></li><li><a href="tel:+918073157844">+91 80731 57844</a></li></ul>
          <p className="footer__status"><i className="live-dot" aria-hidden="true"></i>Available for new projects</p>
        </div>
        <button className="totop magnetic" id="toTop" type="button" aria-label="Back to top">↑</button>
      </div>
      <p className="wordmark" aria-hidden="true">HARISH MOGER</p>
      <div className="container footer__legal"><span>© 2026 Harish Moger</span><span>Designed and built by Harish.</span></div>
    </footer>
  );
}