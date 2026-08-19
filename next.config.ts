import type { NextConfig } from 'next';

/* GitHub Pages Project Page: die Seite liegt unter
   https://bastild.github.io/S-N/ — deshalb basePath.
   `output: export` erzeugt reines HTML/CSS/JS, das Pages
   ohne Server ausliefern kann. */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
