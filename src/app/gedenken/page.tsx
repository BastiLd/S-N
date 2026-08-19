import type { Metadata } from 'next';
import { WolkenBand, Sterne } from '@/components/Himmel';
import { Sternbild, Kerze } from '@/components/Sternbild';
import { Galerie } from '@/components/Galerie';
import { Karte } from '@/components/Karte';
import type { Stueck } from '@/lib/medien';
import { pfad } from '@/lib/pfad';
import medienRoh from '@/data/medien.json';
import { KURATION, GRUPPEN, type Gruppe } from '@/data/kuration';

export const metadata: Metadata = {
  title: 'Gedenken',
  description: 'Eine Seite für Simba und Nala.',
};

/* Das Bild ganz oben. Steht hier und nicht in der Kuration, weil es
   eine Rolle hat und nicht bloss ein Eintrag in einer Liste ist. */
const KOPFBILD = 'img_20170608_140220';

/* Copyright steht sichtbar unter der Galerie — siehe auch die Fusszeile. */
const RECHTE = '© Bastian Klaus';

/* Aus der JSON-Datei liest TypeScript zwei verschiedene Meta-Formen
   heraus (Bild hat Blende und ISO, Video Codec und Dauer). Der Aufbau
   steht in src/lib/medien.ts — hier einmal darauf festlegen. */
const medien = medienRoh as unknown as { bilder: Stueck[]; videos: Stueck[] };

export default function Gedenken() {
  const alle: Stueck[] = [...medien.bilder, ...medien.videos].map((m) => ({
    ...m,
    gross: KURATION[m.id]?.gross ?? false,
    /* Der Text aus der Kuration schlaegt den aus dem Dateinamen. */
    text: KURATION[m.id]?.text ?? m.text,
  }));

  const kopf = alle.find((s) => s.id === KOPFBILD);
  const uebrig = alle.filter((s) => s.id !== KOPFBILD);

  const nachGruppe = (g: Gruppe) => uebrig.filter((s) => KURATION[s.id]?.gruppe === g);
  const ohneGruppe = uebrig.filter((s) => !KURATION[s.id]?.gruppe);

  const gruppenMitInhalt = GRUPPEN.map((g) => ({ ...g, stuecke: nachGruppe(g.key) }))
    .filter((g) => g.stuecke.length > 0);

  const garNichts = alle.length === 0;

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

        {kopf && (
          <figure className="kopfbild">
            <img src={pfad(kopf.pfad)} alt={kopf.text} fetchPriority="high" decoding="async" />
            <figcaption>{kopf.text}</figcaption>
          </figure>
        )}

        {/* ---------- Sternbilder ---------- */}
        <div className="sternbilder">
          <Sternbild
            name="Simba"
            text="Der rote Tiger."
            farbe="#e8a35c"
            versatz={0}
          />
          <Sternbild
            name="Nala"
            text="Die Weiße mit den roten Flecken."
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
          <p>Danke für die Zeit. Für alles.</p>
        </div>

        {/* ---------- Abschnitte ---------- */}
        {gruppenMitInhalt.map((g) => (
          <section key={g.key} className="gruppe">
            <div className="galerie-kopf">
              <span className="eyebrow">{g.text}</span>
              <h2>{g.titel}</h2>
            </div>
            <Galerie stuecke={g.stuecke} />
          </section>
        ))}

        {ohneGruppe.length > 0 && (
          <section className="gruppe">
            <div className="galerie-kopf">
              <span className="eyebrow">Und sonst</span>
              <h2>Alles andere</h2>
              <p>
                Was noch dazugekommen ist. Wer etwas davon einsortieren will,
                trägt es in <code>src/data/kuration.ts</code> ein.
              </p>
            </div>
            <Galerie stuecke={ohneGruppe} />
          </section>
        )}

        {garNichts && (
          <div className="leer">
            <h3>Noch keine Bilder da</h3>
            <p>
              Fotos und Videos in <code>roh/</code> legen und einmal
              <code> npm run aufbereiten</code> laufen lassen — danach stehen
              sie hier.
            </p>
            <span className="pfad">public/medien/bilder/ · public/medien/videos/</span>
          </div>
        )}

        {/* ---------- Karte ---------- */}
        <Karte stuecke={alle} />

        <p className="galerie-fuss">
          Antippen für die große Ansicht: Pfeiltasten oder Wischen zum
          Blättern, <kbd>i</kbd> für die Aufnahmedaten, Mausrad oder zwei
          Finger zum Zoomen, <kbd>Esc</kbd> schließt.
          <span className="rechte">
            Alle Fotos und Videos {RECHTE}. Bitte nicht ohne Rücksprache weiterverwenden.
          </span>
        </p>
      </div>
    </section>
  );
}
