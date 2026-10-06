import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
// wdth.css trae los ejes de peso y ancho: el ancho condensado es la voz de display.
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import 'lenis/dist/lenis.css';
import '@/styles/tokens.css';
import '@/styles/base.css';
import '@/styles/hud.css';
import '@/styles/sections.css';
import '@/styles/overlays.css';

const TITLE = 'Emiliano Santo Tomás — Creative Developer';
const DESCRIPTION =
  'Creative Developer / Full-Stack Developer. Del taller de soldadura al software: sistemas, IoT, IA y experiencias interactivas en WebGL.';
// URL pública (con barra final). La define el workflow de deploy; en local no hace falta.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...(SITE_URL && {
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: SITE_URL },
    openGraph: {
      type: 'website',
      url: SITE_URL,
      title: TITLE,
      description: DESCRIPTION,
      locale: 'es_CL',
      images: [{ url: `${SITE_URL}og-image.jpg`, width: 1200, height: 630, alt: 'Emiliano Santo Tomás — Creative Developer' }],
    },
    twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [`${SITE_URL}og-image.jpg`] },
  }),
};

export const viewport: Viewport = {
  themeColor: '#0e0f11',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="es" data-state="CORE" data-gfx="pending">
      <body>{children}</body>
    </html>
  );
}
