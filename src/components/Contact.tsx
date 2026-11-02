import { SITE } from '../data/siteData';

/* Contact, laid out like the reference: a huge two-line heading over a violet
   glow, a short line, and the form in a glass card. Form logic lives in engine.ts. */
export default function Contact() {
  return (
    <section className="contact" id="contact" aria-labelledby="contactTitle">
      <div className="container contact__inner">
        <h2 className="contact__title" id="contactTitle">Got an idea?<br /><em>Let&apos;s make it real.</em></h2>
        <p className="lead contact__lead">Share your idea and I&apos;ll come back with a plan and a quote.</p>

        <div className="contact__card">
          <form className="form" id="quoteForm" noValidate>
            <div className="form__row">
              <div className="field">
                <label htmlFor="f-name">Name</label>
                <input id="f-name" name="name" type="text" autoComplete="name" placeholder="Your name" required aria-describedby="err-name" />
                <p className="field__err" id="err-name" aria-live="polite"></p>
              </div>
              <div className="field">
                <label htmlFor="f-email">Email</label>
                <input id="f-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required aria-describedby="err-email" />
                <p className="field__err" id="err-email" aria-live="polite"></p>
              </div>
            </div>
            <div className="field">
              <label htmlFor="f-msg">What are you building?</label>
              <textarea id="f-msg" name="message" rows={4} placeholder="Tell me about your project, your brand, your goals…" required aria-describedby="err-message"></textarea>
              <p className="field__err" id="err-message" aria-live="polite"></p>
            </div>
            <button className="btn btn--primary btn--block" type="submit" id="submitBtn">Get my quote →</button>
            <p className="form__status" id="formStatus" role="status"></p>
          </form>

          <div className="form-done" id="formDone" hidden>
            <p className="h2">Got it. <em>Talk soon.</em></p>
            <p className="lead">I&apos;ll get back to you with a plan and a quote.</p>
          </div>
        </div>

        <p className="contact__direct">
          or email me directly →{' '}
          <button className="copy" type="button" id="copyEmail" data-copy={SITE.contact.email}>{SITE.contact.email}</button>
          <span className="copy__toast" id="copyToast" role="status" aria-live="polite"></span>
        </p>
      </div>
    </section>
  );
}