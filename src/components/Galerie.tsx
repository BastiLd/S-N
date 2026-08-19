'use client';

import { useCallback, useEffect, useState } from 'react';
import { pfad } from '@/lib/pfad';

export type Stueck = {
  art: 'bild' | 'video';
  datei: string;
  pfad: string;
  text: string;
};

/* Galerie mit Lightbox. Bedienbar per Maus und per Tastatur:
   Pfeiltasten blaettern, Escape schliesst. */
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
    /* Hintergrund nicht mitscrollen lassen, solange die Lightbox offen ist */
    const vorher = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', taste);
      document.body.style.overflow = vorher;
    };
  }, [offen, weiter]);

  if (stuecke.length === 0) return null;

  const aktuell = offen === null ? null : stuecke[offen];

  return (
    <>
      <div className="galerie">
        {stuecke.map((s, i) => (
          <button
            key={s.pfad}
            /* Jedes vierte Stueck darf breiter stehen — das bricht das
               starre Raster auf, ohne dass etwas ausgerichtet werden muss. */
            className={'stueck' + (i % 7 === 0 ? ' gross' : '')}
            onClick={() => setOffen(i)}
            aria-label={`${s.text} — gross ansehen`}
          >
            {s.art === 'bild' ? (
              <img src={pfad(s.pfad)} alt={s.text} loading="lazy" decoding="async" />
            ) : (
              <>
                <video src={pfad(s.pfad)} muted playsInline preload="metadata" />
                <span className="stueck-play" aria-hidden="true">
                  <svg width="13" height="13" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M2 1.2 L10.4 6 L2 10.8 Z" />
                  </svg>
                </span>
              </>
            )}
            <span className="stueck-text">{s.text}</span>
          </button>
        ))}
      </div>

      {aktuell && (
        <div className="lb" role="dialog" aria-modal="true" aria-label={aktuell.text}
             onClick={() => setOffen(null)}>
          <button className="lb-zu" onClick={() => setOffen(null)} aria-label="Schliessen">
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
                      aria-label="Naechstes">
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
              <video src={pfad(aktuell.pfad)} controls autoPlay playsInline />
            )}
            <p className="lb-text">{aktuell.text}</p>
          </div>
        </div>
      )}
    </>
  );
}
