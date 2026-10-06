import { Split } from '@/components/Split';
import { SITE } from '@/data/site';

/** 01 — CORE. El nombre entra cuando se abren las persianas de la intro. */
export function Hero() {
  return (
    <section className="hero" id="core" data-section aria-labelledby="hero-title">
      <h1 className="hero__title display" id="hero-title">
        <span className="hero__line">
          <Split text={SITE.firstName} />
        </span>
        <span className="hero__line">
          <Split text={SITE.lastName} offset={SITE.firstName.length} />
        </span>
      </h1>
      <p className="hero__role mono">{SITE.role}</p>
      <dl className="hero__meta mono">
        <div>
          <dt>BASE</dt>
          <dd>{SITE.location}</dd>
        </div>
        <div>
          <dt>POS</dt>
          <dd>{SITE.coordinates}</dd>
        </div>
      </dl>
      <p className="hero__hint mono" aria-hidden="true">
        SCROLL — EL SISTEMA CAMBIA
      </p>
    </section>
  );
}
