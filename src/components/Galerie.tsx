'use client';

/* Raster mit Vorschaubildern; die Grossansicht macht der Betrachter.
   © Bastian Klaus */

import { useState } from 'react';
import { pfad } from '@/lib/pfad';
import type { Stueck } from '@/lib/medien';
import { Betrachter } from './betrachter/Betrachter';

export type { Stueck };

/* Im Raster steht immer nur ein Standbild — auch bei Videos. Sonst
   wuerde der Browser saemtliche Videodateien anlesen, nur um Kacheln
   zu zeigen. Das <video> entsteht erst in der Grossansicht. */
function Kachel({ s, onOeffnen, eigenesMass = false }:
  { s: Stueck; onOeffnen: () => void; eigenesMass?: boolean }) {
  /* Hervorgehobene Bilder behalten ihr echtes Seitenverhaeltnis und
     werden nicht beschnitten. Die kleinen Kacheln laufen alle auf 3:4 —
     das gibt saubere Reihen, und das ungeschnittene Bild ist ohnehin
     einen Klick entfernt. */
  const verhaeltnis = eigenesMass && s.breite && s.hoehe ? `${s.breite} / ${s.hoehe}` : undefined;

  return (
    <button
      className="stueck"
      style={verhaeltnis ? { aspectRatio: verhaeltnis } : undefined}
      onClick={onOeffnen}
      aria-label={s.art === 'video' ? `${s.text} — Video abspielen` : `${s.text} — groß ansehen`}
    >
      <img src={pfad(s.vorschau)} alt={s.text} loading="lazy" decoding="async" />
      {s.art === 'video' && (
        <span className="stueck-play" aria-hidden="true">
          <svg width="17" height="17" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2.4 1.2 L10.4 6 L2.4 10.8 Z" />
          </svg>
        </span>
      )}
      {/* Datum und Laenge stehen bewusst NICHT hier: sie gehoeren zu den
          verschluesselten Aufnahmedaten und waeren im Raster fuer jeden
          lesbar. Sie stehen in der Grossansicht hinter dem i-Knopf. */}
      <span className="stueck-text">{s.text}</span>
    </button>
  );
}

export function Galerie({ stuecke }: { stuecke: Stueck[] }) {
  const [offen, setOffen] = useState<number | null>(null);
  if (stuecke.length === 0) return null;

  const hervor = stuecke.map((s, i) => ({ s, i })).filter(({ s }) => s.gross);
  const rest = stuecke.map((s, i) => ({ s, i })).filter(({ s }) => !s.gross);

  return (
    <>
      {hervor.length > 0 && (
        <div className="galerie-gross">
          {hervor.map(({ s, i }) => (
            <Kachel key={s.pfad} s={s} onOeffnen={() => setOffen(i)} eigenesMass />
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="galerie">
          {rest.map(({ s, i }) => (
            <Kachel key={s.pfad} s={s} onOeffnen={() => setOffen(i)} />
          ))}
        </div>
      )}

      {offen !== null && (
        <Betrachter
          stuecke={stuecke}
          index={offen}
          setIndex={setOffen}
          onSchliessen={() => setOffen(null)}
        />
      )}
    </>
  );
}
