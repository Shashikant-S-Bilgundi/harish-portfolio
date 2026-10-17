import Arrow from './Arrow';

const NEEDS = ['Website', 'Landing page', 'Shopify store', 'App UI/UX', 'Motion & video', 'Branding'] as const;
const BUDGETS = ['Under ₹50k', '₹50k–1.5L', '₹1.5L–3L', '₹3L+', 'Not sure yet'] as const;

export default function Contact() {
  return (
    <section className="contact" id="contact" data-nav="contact" aria-labelledby="contactTitle">
      <div className="contact__panel">
        <div className="contact__main">
          <h2 className="sr-only" id="contactTitle">Request a quote</h2>

          {/* Validation and submit are handled by script.js (novalidate kept) */}
          <form className="form" id="quoteForm" noValidate>
            <div className="field-row">
              <div className="field">
                <input id="f-name" name="name" type="text" autoComplete="name" placeholder=" " required aria-describedby="err-name" />
                <label htmlFor="f-name">Your name</label>
                <p className="err" id="err-name" aria-live="polite"></p>
              </div>
              <div className="field">
                <input id="f-email" name="email" type="email" autoComplete="email" placeholder=" " required aria-describedby="err-email" />
                <label htmlFor="f-email">Email</label>
                <p className="err" id="err-email" aria-live="polite"></p>
              </div>
            </div>
            <div className="field">
              <input id="f-phone" name="phone" type="tel" autoComplete="tel" placeholder=" " />
              <label htmlFor="f-phone">Phone or WhatsApp (optional)</label>
            </div>

            <fieldset className="chips" aria-describedby="err-need">
              <legend>What do you need?</legend>
              <div className="chips__list">
                {NEEDS.map((v) => (
                  <label className="chip" key={v}><input type="checkbox" name="need" value={v} /><span>{v}</span></label>
                ))}
              </div>
              <p className="err" id="err-need" aria-live="polite"></p>
            </fieldset>

            {/* [CONFIRM] budget currency and ranges */}
            <fieldset className="chips">
              <legend>Budget <span className="opt">(optional)</span></legend>
              <div className="chips__list">
                {BUDGETS.map((v) => (
                  <label className="chip" key={v}><input type="radio" name="budget" value={v} /><span>{v}</span></label>
                ))}
              </div>
            </fieldset>

            <div className="field">
              <textarea id="f-msg" name="message" rows={4} placeholder=" " required aria-describedby="err-message"></textarea>
              <label htmlFor="f-msg">Tell me about your project</label>
              <p className="err" id="err-message" aria-live="polite"></p>
            </div>

            <div className="form__foot">
              <button className="btn btn--primary submit magnetic" type="submit"><span className="btn__label">Send for a quote</span><Arrow /></button>
              <p className="form__status" id="formStatus" role="status"></p>
            </div>
          </form>

          <div className="form-done" id="formDone" hidden>
            <p className="eyebrow">Message received</p>
            <p className="form-done__title" aria-live="polite"></p>
            <p className="form-done__note">I&apos;ll get back to you with a plan and a quote soon.</p>
          </div>
        </div>

        <aside className="contact__direct" aria-label="Contact details" data-reveal="">
          <div className="direct__item"><p className="eyebrow">Email</p><a href="mailto:harishmoger03@gmail.com">harishmoger03@gmail.com</a></div>
          <div className="direct__item"><p className="eyebrow">Phone</p><a href="tel:+918073157844">+91 80731 57844</a></div>
          {/* [CONFIRM] this number is on WhatsApp */}
          <div className="direct__item"><p className="eyebrow">WhatsApp</p><a href="https://wa.me/918073157844" target="_blank" rel="noopener noreferrer">Message on WhatsApp ↗</a></div>
          <div className="direct__item">
            <p className="eyebrow">Elsewhere</p>
            <div className="socials">
              <a className="btn btn--ghost btn--sm" href="https://www.linkedin.com/in/harish-moger-97531618b/" target="_blank" rel="noopener noreferrer"><span className="btn__label">LinkedIn ↗</span></a>
              <a className="btn btn--ghost btn--sm" href="https://www.behance.net/harishmoger2" target="_blank" rel="noopener noreferrer"><span className="btn__label">Behance ↗</span></a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}