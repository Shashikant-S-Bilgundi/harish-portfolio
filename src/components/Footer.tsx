import { SITE } from '../data/siteData';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__row">
        <p className="footer__name">{SITE.name} — {SITE.role}</p>
        <p className="footer__note">Designed and built by me.</p>
        <p className="footer__links">
          {SITE.socials.map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a>
          ))}
        </p>
        <button className="footer__top" type="button" id="toTop" aria-label="Back to top">© {SITE.year} ↑</button>
      </div>
    </footer>
  );
}