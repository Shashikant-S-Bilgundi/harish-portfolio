import { SITE } from '../data/siteData';

export default function Stats() {
  return (
    <section className="stats" aria-label="Highlights">
      <ul className="stats__band">
        {SITE.stats.map((s) => (
          <li className="stat" key={s.label}>
            <p className="stat__num">
              {s.value == null
                ? s.display
                : <><span className="stat__value" data-count={s.value}>{s.value}</span>{s.suffix ?? ''}</>}
            </p>
            <p className="stat__label">{s.label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}