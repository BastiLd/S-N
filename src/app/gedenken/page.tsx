import type { Metadata } from 'next';
import { WolkenBand, Sterne } from '@/components/Himmel';
import { Sternbild, Kerze } from '@/components/Sternbild';
import { Galerie, type Stueck } from '@/components/Galerie';
import medien from '@/data/medien.json';

export const metadata: Metadata = {
  title: 'Gedenken',
  description: 'Eine Seite für Simba und Nala.',
};

export default function Gedenken() {
  /* Bilder zuerst, Videos danach — beides kommt aus public/medien/,
     eingelesen von scripts/medien.mjs beim Bauen. */
  const stuecke = [...medien.bilder, ...medien.videos] as Stueck[];

  return (
    <section className="nacht">
      <Sterne anzahl={190} saat={20260520} />
      <div className="nacht-mond" aria-hidden="true" />
      <div className="nacht-wolken" aria-hidden="true">
        <WolkenBand lage="fern"  farbe="#c9d4f2" />
        <WolkenBand lage="mitte" farbe="#e2e8ff" />
      </div>

      <div className="wrap">
        {/* ---------- Kopf ---------- */}
        <div className="gedenk-hero">
          <span className="eyebrow">In Erinnerung</span>
          <h1>Simba &amp; Nala</h1>
          <p className="lead">
            Zwei, die einfach dazugehört haben. So selbstverständlich, dass man
            erst merkt, wie viel Platz sie eingenommen haben, wenn er leer ist.
          </p>
        </div>

        {/* ---------- Sternbilder ---------- */}
        <div className="sternbilder">
          <Sternbild
            name="Simba"
            text="Immer zuerst da, wenn etwas los war."
            farbe="#f6c97a"
            versatz={0}
          />
          <Sternbild
            name="Nala"
            text="Und immer da, wenn nichts los war."
            farbe="#ffe3ad"
            versatz={1.1}
          />
        </div>

        {/* ---------- Widmung ----------
            PLATZHALTER-TEXT. Bewusst allgemein gehalten, weil hier eigene
            Worte hingehören. Einfach die beiden Absätze austauschen —
            am Layout ändert sich dadurch nichts. */}
        <div className="widmung">
          <Kerze />
          <p>
            Diese Seite ist der Grund, warum es das Ganze überhaupt gibt.
            Alles andere hier — die Suche nach der richtigen Praxis, die
            Status-Ampel, der ganze Aufwand mit den Notfällen — trägt ihre
            Namen.
          </p>
          <p>
            Danke für die Zeit. Für alles.
          </p>
        </div>

        {/* ---------- Galerie ---------- */}
        <div className="galerie-kopf" id="bilder">
          <span className="eyebrow">Bilder und Videos</span>
          <h2>Wie sie waren</h2>
          <p>
            {stuecke.length > 0
              ? 'Antippen für die große Ansicht. Mit den Pfeiltasten weiterblättern, Escape schließt.'
              : 'Hier ist noch Platz.'}
          </p>
        </div>

        {stuecke.length > 0 ? (
          <Galerie stuecke={stuecke} />
        ) : (
          <div className="leer">
            <h3>Noch keine Bilder da</h3>
            <p>
              Fotos und Videos einfach in die Ordner legen — beim nächsten Push
              stehen sie automatisch hier. Nichts weiter zu tun.
            </p>
            <span className="pfad">public/medien/bilder/ · public/medien/videos/</span>
          </div>
        )}
      </div>
    </section>
  );
}
