import { System } from '@/components/System';
import { Contact } from '@/sections/Contact';
import { Hero } from '@/sections/Hero';
import { Origin } from '@/sections/Origin';
import { Playground } from '@/sections/Playground';
import { StackMatrix } from '@/sections/StackMatrix';
import { Systems } from '@/sections/Systems';

/**
 * Todo el contenido está en el HTML: el sitio se lee completo sin WebGL.
 * El orden de las secciones es el de SECTION_IDS (lib/track.ts).
 */
export default function Page() {
  return (
    <>
      <a className="skip" href="#core">
        Saltar al contenido
      </a>
      <System />
      <main>
        <Hero />
        <Origin />
        <Systems />
        <StackMatrix />
        <Playground />
        <Contact />
      </main>
    </>
  );
}
