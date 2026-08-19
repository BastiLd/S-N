import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'S-N — Simba & Nala',
    short_name: 'S · N',
    description: 'Projekte rund um tierärztliche Soforthilfe in Kärnten — und eine Gedenkseite für Simba und Nala.',
    lang: 'de',
    start_url: '.',
    scope: '.',
    display: 'standalone',
    background_color: '#06091a',
    theme_color: '#0c7d72',
  };
}
