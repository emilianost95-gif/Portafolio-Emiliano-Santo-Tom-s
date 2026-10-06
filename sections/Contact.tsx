import { Split } from '@/components/Split';
import { SITE } from '@/data/site';

/** 06 — READY. El cierre del recorrido: el núcleo se abre en un campo. */
export function Contact() {
  return (
    <section className="contact" id="contact" data-section aria-labelledby="contact-title">
      <p className="mono contact__ready" data-reveal>
        SYSTEM READY
      </p>
      <h2 className="contact__title display" id="contact-title" data-reveal>
        <Split text="BUILD" />
        <br />
        <Split text="SOMETHING." offset={5} />
      </h2>
      <div className="contact__sign" data-reveal>
        <p className="contact__name">{SITE.name}</p>
        <ul className="contact__links mono">
          <li>
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </li>
          <li>
            <a href={SITE.github} target="_blank" rel="noopener noreferrer">
              GITHUB ↗
            </a>
          </li>
          <li>
            <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer">
              LINKEDIN ↗
            </a>
          </li>
        </ul>
      </div>
      <footer className="contact__foot mono">
        <span>© 2026 {SITE.name}</span>
        <span>{SITE.coordinates}</span>
      </footer>
    </section>
  );
}
