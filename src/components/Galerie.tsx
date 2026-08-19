'use client';

/* Galerie mit Grossansicht.  © Bastian Klaus */

import { useCallback, useEffect, useState } from 'react';
import { pfad } from '@/lib/pfad';

export type Stueck = {
  art: 'bild' | 'video';
  datei: string;
  id: string;
  pfad: string;
  vorschau: string;
  breite: number | null;
  hoehe: number | null;
  text: string;
  gross?: boolean;
};

/* Im Raster steht immer nur ein Standbild — auch bei Videos. Sonst
   wuerde der Browser saemtliche Videodateien anlesen, nur um Kacheln
   zu zeigen. Das <video> entsteht erst in der Grossansicht. */
function Kachel({ s, onOeffnen, eigenesMass = false }:
  { s: Stueck; onOeffnen: () => void; eigenesMass?: boolean }) {
  /* Hervorgehobene Bilder behalten ihr echtes Seitenverhaeltnis und
     werden nicht beschnitten. Die kleinen Kacheln im Raster laufen alle
     auf 3:4 — das gibt saubere Reihen, und das ungeschnittene Bild ist
     ohnehin einen Klick entfernt. */
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
      <span className="stueck-text">{s.text}</span>
    </button>
  );
}

export function Galerie({ stuecke }: { stuecke: Stueck[] }) {
  const [offen, setOffen] = useState<number | null>(null);

  const weiter = useCallback(
    (richtung: number) =>
      setOffen((i) => (i === null ? null : (i + richtung + stuecke.length) % stuecke.length)),
    [stuecke.length],
  );

  useEffect(() => {
    if (offen === null) return;
    const taste = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOffen(null);
      else if (e.key === 'ArrowRight') weiter(1);
      else if (e.key === 'ArrowLeft') weiter(-1);
    };
    window.addEventListener('keydown', taste);
    /* Hintergrund nicht mitscrollen lassen, solange die Grossansicht offen ist */
    const vorher = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', taste);
      document.body.style.overflow = vorher;
    };
  }, [offen, weiter]);

  if (stuecke.length === 0) return null;
  const aktuell = offen === null ? null : stuecke[offen];

  /* Hervorgehobene Bilder bekommen eine eigene, breite Reihe. Der Rest
     laeuft darunter als gleichmaessiges Raster. */
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

      {aktuell && (
        <div className="lb" role="dialog" aria-modal="true" aria-label={aktuell.text}
             onClick={() => setOffen(null)}>
          <button className="lb-zu" onClick={() => setOffen(null)} aria-label="Schließen">
            <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M4 4 L16 16 M16 4 L4 16" />
            </svg>
          </button>

          {stuecke.length > 1 && (
            <>
              <button className="lb-pfeil links"
                      onClick={(e) => { e.stopPropagation(); weiter(-1); }}
                      aria-label="Vorheriges">
                <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.5 4 L6 10 L12.5 16" />
                </svg>
              </button>
              <button className="lb-pfeil rechts"
                      onClick={(e) => { e.stopPropagation(); weiter(1); }}
                      aria-label="Nächstes">
                <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7.5 4 L14 10 L7.5 16" />
                </svg>
              </button>
            </>
          )}

          <div className="lb-inhalt" onClick={(e) => e.stopPropagation()}>
            {aktuell.art === 'bild' ? (
              <img src={pfad(aktuell.pfad)} alt={aktuell.text} />
            ) : (
              /* key erzwingt ein frisches <video> beim Weiterblaettern —
                 sonst behaelt der Player die alte Quelle. */
              <video
                key={aktuell.pfad}
                src={pfad(aktuell.pfad)}
                poster={pfad(aktuell.vorschau)}
                controls autoPlay playsInline preload="auto"
              />
            )}
            <p className="lb-text">
              {aktuell.text}
              <span className="lb-zaehler">{(offen ?? 0) + 1} / {stuecke.length} · © Bastian Klaus</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
