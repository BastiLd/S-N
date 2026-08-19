import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

/* Die Seite darf gefunden werden, die Mediendateien selbst aber nicht
   einzeln in der Bildersuche landen. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/medien/'] }],
    sitemap: 'https://bastild.github.io/S-N/sitemap.xml',
  };
}
