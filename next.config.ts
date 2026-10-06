import type { NextConfig } from 'next';

// GitHub Pages sirve el sitio en una subcarpeta (/nombre-del-repo). El workflow
// de deploy pasa esa ruta; en local queda vacía y el sitio vive en la raíz.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

// Export estático: el sitio no necesita servidor y puede alojarse en cualquier hosting de archivos.
const config: NextConfig = {
  output: 'export',
  basePath,
  images: { unoptimized: true },
  reactStrictMode: true,
  devIndicators: false,
};

export default config;
