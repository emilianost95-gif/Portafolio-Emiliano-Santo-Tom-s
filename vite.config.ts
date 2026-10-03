import { defineConfig, loadEnv, type Plugin } from 'vite';

/**
 * Genera robots.txt y sitemap.xml en el build a partir de VITE_SITE_URL.
 * Así la URL pública vive en un solo lugar (.env) y no queda duplicada
 * a mano en index.html, robots y sitemap.
 */
function seoFiles(siteUrl: string): Plugin {
  const lastmod = new Date().toISOString().slice(0, 10);
  return {
    name: 'seo-files',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`,
      });
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source:
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          `  <url><loc>${siteUrl}</loc><lastmod>${lastmod}</lastmod></url>\n` +
          `</urlset>\n`,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const siteUrl = env.VITE_SITE_URL;
  if (!siteUrl || !siteUrl.endsWith('/')) {
    throw new Error('VITE_SITE_URL debe estar definida en .env y terminar en "/"');
  }

  return {
    // Rutas relativas: funciona igual en GitHub Pages (subcarpeta) que en un dominio propio.
    base: './',
    plugins: [seoFiles(siteUrl)],
    build: {
      target: 'es2022',
      // Three.js (build WebGPU + TSL) pesa ~245 KB gzip y no se deja recortar mucho.
      // Es un chunk lazy que se pide después del primer render; el límite está puesto
      // justo encima para que cualquier crecimiento NUEVO vuelva a avisar.
      chunkSizeWarningLimit: 920,
    },
  };
});
