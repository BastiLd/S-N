import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const BASIS = 'https://bastild.github.io/S-N';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASIS}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${BASIS}/gedenken/`, changeFrequency: 'monthly', priority: 0.8 },
  ];
}
