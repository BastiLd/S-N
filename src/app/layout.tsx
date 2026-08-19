import type { Metadata, Viewport } from 'next';
import { Kopf, Fuss } from '@/components/Rahmen';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'S-N — Simba & Nala',
    template: '%s · S-N',
  },
  description:
    'Projekte rund um tierärztliche Soforthilfe in Kärnten — und eine Gedenkseite für Simba und Nala.',
  authors: [{ name: 'Bastian Klaus' }],
  creator: 'Bastian Klaus',
  publisher: 'Bastian Klaus',
  /* Steht als <meta name="copyright"> im Kopf jeder Seite. */
  other: { copyright: '© Bastian Klaus — Alle Rechte vorbehalten' },
  openGraph: {
    title: 'S-N — Simba & Nala',
    description:
      'Projekte rund um tierärztliche Soforthilfe in Kärnten — und eine Gedenkseite für Simba und Nala.',
    locale: 'de_AT',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0c7d72',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <Kopf />
        <main>{children}</main>
        <Fuss />
      </body>
    </html>
  );
}
