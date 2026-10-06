import type { SectionId } from './track';
import { scroller } from './world';

export function goToSection(section: SectionId): void {
  const target = document.getElementById(section);
  if (target) scroller.to(target);
}
