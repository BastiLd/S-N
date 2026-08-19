'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PfotenSymbol } from './Himmel';

export function Kopf() {
  const pfad = usePathname() ?? '/';
  const aktiv = (ziel: string) =>
    ziel === '/' ? pfad === '/' : pfad.startsWith(ziel);

  return (
    <header className="kopf">
      <Link href="/" className="kopf-marke">
        <span className="mark" aria-hidden="true">
          <PfotenSymbol groesse={18} />
        </span>
        <span>
          <span className="name">S&nbsp;·&nbsp;N</span>
          <span className="sub">Simba &amp; Nala</span>
        </span>
      </Link>
      <nav aria-label="Hauptnavigation">
        <Link href="/" className={aktiv('/') ? 'aktiv' : ''}>Start</Link>
        <Link href="/gedenken" className={aktiv('/gedenken') ? 'aktiv' : ''}>Gedenken</Link>
        <a href="https://github.com/BastiLd/S-N" target="_blank" rel="noreferrer">Code</a>
      </nav>
    </header>
  );
}

export function Fuss() {
  return (
    <footer className="fuss">
      <div className="wrap">
        <div className="fuss-grid">
          <div style={{ maxWidth: '34ch' }}>
            <div className="titel">S-N — Simba &amp; Nala</div>
            <p style={{ marginTop: 10, lineHeight: 1.7 }}>
              Projekte rund um tierärztliche Soforthilfe in Kärnten.
              Benannt nach zwei, die immer da waren.
            </p>
          </div>

          <div>
            <div className="titel">Branches</div>
            <ul>
              <li><a href="https://github.com/BastiLd/S-N/tree/alles">alles</a> — alles zusammen</li>
              <li><a href="https://github.com/BastiLd/S-N/tree/vetnow-app">vetnow-app</a> — Web, Handy, Extension</li>
              <li><a href="https://github.com/BastiLd/S-N/tree/pages">pages</a> — diese Seite</li>
              <li><a href="https://github.com/BastiLd/S-N/tree/main">main</a> — nur die Projektidee</li>
            </ul>
          </div>

          <div>
            <div className="titel">Hin</div>
            <ul>
              <li><Link href="/gedenken">Gedenkseite</Link></li>
              <li><a href="https://bastild.github.io/vetnow/">VetNow im Web</a></li>
              <li><a href="https://github.com/BastiLd/S-N">Repository</a></li>
            </ul>
          </div>
        </div>

        <div className="fuss-unten">
          Alle Praxisdaten in den Apps sind Platzhalter-Testdaten. Keine
          medizinische Beratung — im Notfall bitte immer direkt anrufen.
        </div>
      </div>
    </footer>
  );
}
