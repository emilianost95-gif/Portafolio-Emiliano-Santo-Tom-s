import type { CSSProperties } from 'react';

interface SplitProps {
  readonly text: string;
  /** Desfase inicial, en caracteres, para encadenar varias líneas. */
  readonly offset?: number;
}

/**
 * Texto partido en caracteres para animarlo desde CSS (cada uno recibe --i).
 * Los lectores de pantalla leen el texto entero, no letra por letra.
 */
export function Split({ text, offset = 0 }: SplitProps) {
  return (
    <span className="split">
      <span className="sr-only">{text}</span>
      {Array.from(text).map((char, index) => (
        <span key={index} className="split__char" aria-hidden="true" style={{ '--i': index + offset } as CSSProperties}>
          {char === ' ' ? ' ' : char}
        </span>
      ))}
    </span>
  );
}
