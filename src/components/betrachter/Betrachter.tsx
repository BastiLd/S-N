'use client';

/* ============================================================
   Grossansicht: Rahmen um Bild- und Videoansicht.
   © Bastian Klaus

   Kuemmert sich um alles, was beide gemeinsam haben: Kopfleiste,
   Blaettern, Filmstreifen, Aufnahmedaten, Diashow, Tastatur und
   Fokusfalle.

   Der Betrachter haengt per Portal an <body>. Grund: er steht im
   Markup innerhalb von .nacht, und das hat `isolation: isolate`
   (noetig fuer Sterne und Wolken mit negativem z-index). Sein z-index
   gaelte sonst nur dort — die Kopfzeile der Seite lag darueber und
   schluckte die Klicks.
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { pfad } from '@/lib/pfad';
import { type Stueck, metaSchluessel } from '@/lib/medien';
import { useGeheimnis } from '@/lib/geheim';
import { Schloss } from '../Schloss';
import { BildAnsicht, type BildSteuerung } from './BildAnsicht';
import { VideoAnsicht } from './VideoAnsicht';
import { InfoTafel } from './InfoTafel';

const DIA_TAKT = 4500;

export function Betrachter({
  stuecke, index, setIndex, onSchliessen,
}: {
  stuecke: Stueck[];
  index: number;
  setIndex: (i: number) => void;
  onSchliessen: () => void;
}) {
  const [infoOffen, setInfoOffen] = useState(false);
  const [diaLaeuft, setDiaLaeuft] = useState(false);
  const [steuerung, setSteuerung] = useState<BildSteuerung | null>(null);
  const rahmen = useRef<HTMLDivElement>(null);
  const vorherigerFokus = useRef<Element | null>(null);
  const tresor = useGeheimnis();

  const aktuell = stuecke[index];
  const istBild = aktuell?.art === 'bild';

  const weiter = useCallback((r: number) => {
    setIndex((index + r + stuecke.length) % stuecke.length);
  }, [index, stuecke.length, setIndex]);

  /* ---------- Fokus merken und spaeter zurueckgeben ----------
     Ein "bin ich schon im Browser"-State braucht es nicht: der
     Betrachter wird erst nach einem Klick gerendert, also niemals
     beim Vorab-Rendern auf dem Server. */
  useEffect(() => {
    vorherigerFokus.current = document.activeElement;
    return () => { (vorherigerFokus.current as HTMLElement | null)?.focus?.(); };
  }, []);

  /* ---------- Hintergrund festhalten ---------- */
  useEffect(() => {
    const vorher = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = vorher; };
  }, []);

  /* ---------- Nachbarn vorladen ---------- */
  useEffect(() => {
    for (const r of [1, -1, 2]) {
      const n = stuecke[(index + r + stuecke.length) % stuecke.length];
      if (n?.art === 'bild') { const i = new Image(); i.src = pfad(n.pfad); }
    }
  }, [index, stuecke]);

  /* ---------- Diashow ---------- */
  useEffect(() => {
    if (!diaLaeuft) return;
    /* Videos laufen selbst — die Diashow wartet, bis sie durch sind. */
    if (aktuell?.art === 'video') return;
    const u = window.setTimeout(() => weiter(1), DIA_TAKT);
    return () => window.clearTimeout(u);
  }, [diaLaeuft, index, aktuell, weiter]);

  /* ---------- Tastatur ---------- */
  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      const ziel = e.target as HTMLElement;
      if (ziel?.tagName === 'INPUT' || ziel?.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') (ziel as HTMLInputElement).blur();
        return;
      }
      switch (e.key) {
        case 'Escape': onSchliessen(); break;
        case 'ArrowRight': if (istBild) weiter(1); break;
        case 'ArrowLeft': if (istBild) weiter(-1); break;
        case 'PageDown': case 'n': case 'N': weiter(1); break;
        case 'PageUp': case 'p': case 'P': weiter(-1); break;
        case 'Home': setIndex(0); break;
        case 'End': setIndex(stuecke.length - 1); break;
        case 'i': case 'I': setInfoOffen((o) => !o); break;
        case 's': case 'S': setDiaLaeuft((d) => !d); break;
        case '+': case '=': steuerung?.hinein(); break;
        case '-': case '_': steuerung?.hinaus(); break;
        case '0': if (istBild) steuerung?.zuruecksetzen(); break;
        case 'r': case 'R': steuerung?.drehen(); break;
      }
    };
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, [weiter, onSchliessen, steuerung, istBild, setIndex, stuecke.length]);

  /* ---------- Fokus bleibt im Fenster ---------- */
  useEffect(() => {
    const el = rahmen.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    const falle = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const ziele = el.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (ziele.length === 0) return;
      const erster = ziele[0];
      const letzter = ziele[ziele.length - 1];
      if (e.shiftKey && document.activeElement === erster) { e.preventDefault(); letzter.focus(); }
      else if (!e.shiftKey && document.activeElement === letzter) { e.preventDefault(); erster.focus(); }
    };
    el.addEventListener('keydown', falle);
    return () => el.removeEventListener('keydown', falle);
  }, []);

  if (typeof document === 'undefined' || !aktuell) return null;

  const m = tresor.daten?.[metaSchluessel(aktuell)] ?? null;

  const inhalt = (
    <div className="bt" role="dialog" aria-modal="true" aria-label={`Großansicht: ${aktuell.text}`}
         ref={rahmen} tabIndex={-1}>

      {/* ---------- Kopfleiste ---------- */}
      <header className="bt-kopf">
        <div className="bt-titel">
          <h2 className="bt-text">{aktuell.text}</h2>
          <p className="bt-zaehler">
            {index + 1} <span aria-hidden="true">/</span><span className="sr-only">von</span> {stuecke.length}
            {aktuell.art === 'video' && <span className="bt-marke">Video</span>}
          </p>
        </div>

        <div className="bt-knoepfe">
          {istBild && steuerung && (
            <>
              <button className="bt-knopf nur-gross" onClick={steuerung.hinaus}
                      disabled={steuerung.zoom <= 1.001} aria-label="Verkleinern" title="Taste −">
                <Lupe minus />
              </button>
              <button className="bt-knopf nur-gross" onClick={steuerung.hinein}
                      aria-label="Vergrößern" title="Taste +">
                <Lupe />
              </button>
              <button className="bt-knopf" onClick={steuerung.drehen} aria-label="Drehen" title="Taste r">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 5.5 L20 9.5 L16 13.5" />
                  <path d="M20 9.5H9a5 5 0 0 0 0 10h2" />
                </svg>
              </button>
            </>
          )}

          <button className={'bt-knopf' + (diaLaeuft ? ' an' : '')} onClick={() => setDiaLaeuft((d) => !d)}
                  aria-label={diaLaeuft ? 'Diashow anhalten' : 'Diashow starten'} aria-pressed={diaLaeuft} title="Taste s">
            {diaLaeuft
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.2" /><rect x="14" y="5" width="4" height="14" rx="1.2" /></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5 L19 12 L7 19.5 Z" /></svg>}
          </button>

          <a className="bt-knopf nur-gross" href={pfad(aktuell.pfad)} download
             aria-label="Herunterladen" title="Original speichern">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3.5v11M7.5 10 L12 14.5 L16.5 10" /><path d="M4.5 18.5h15" />
            </svg>
          </a>

          {tresor.vorhanden !== false && (
            <button className={'bt-knopf' + (infoOffen ? ' an' : '')} onClick={() => setInfoOffen((o) => !o)}
                    aria-label="Aufnahmedaten" aria-pressed={infoOffen} title="Taste i">
              <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="10" cy="10" r="8" /><path d="M10 9 V14" />
                <circle cx="10" cy="6.2" r="1.1" fill="currentColor" stroke="none" />
              </svg>
            </button>
          )}

          <button className="bt-knopf bt-zu" onClick={onSchliessen} aria-label="Schließen" title="Esc">
            <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M4.5 4.5 L15.5 15.5 M15.5 4.5 L4.5 15.5" />
            </svg>
          </button>
        </div>
      </header>

      {/* ---------- Bühne ---------- */}
      <main className="bt-buehne">
        {istBild ? (
          <BildAnsicht
            key={aktuell.pfad}
            quelle={pfad(aktuell.pfad)}
            beschreibung={aktuell.text}
            aufSteuerung={setSteuerung}
            aufWisch={weiter}
            aufSchliessen={onSchliessen}
          />
        ) : (
          <VideoAnsicht
            key={aktuell.pfad}
            quelle={pfad(aktuell.pfad)}
            standbild={pfad(aktuell.vorschau)}
            beschreibung={aktuell.text}
            aufWisch={weiter}
            aufSchliessen={onSchliessen}
          />
        )}

        {stuecke.length > 1 && (
          <>
            <button className="bt-pfeil links" onClick={() => weiter(-1)} aria-label="Vorheriges">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.5 4 L6 10 L12.5 16" /></svg>
            </button>
            <button className="bt-pfeil rechts" onClick={() => weiter(1)} aria-label="Nächstes">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 4 L14 10 L7.5 16" /></svg>
            </button>
          </>
        )}

        {diaLaeuft && istBild && (
          <span className="bt-dia-balken" key={index} style={{ animationDuration: `${DIA_TAKT}ms` }} />
        )}
      </main>

      {/* ---------- Aufnahmedaten ---------- */}
      {infoOffen && (
        <aside className="bt-info">
          {tresor.offen
            ? <InfoTafel meta={m} onAbschliessen={tresor.abschliessen} />
            : <Schloss
                titel="Aufnahmedaten"
                text="Kamera, Zeitpunkt und Ort sind verschlüsselt. Mit dem Passwort werden sie hier im Browser aufgeschlossen."
                laeuft={tresor.laeuft}
                fehler={tresor.fehler}
                onAufschliessen={tresor.aufschliessen}
              />}
        </aside>
      )}

      {/* ---------- Filmstreifen ---------- */}
      {stuecke.length > 1 && (
        <nav className="bt-streifen" aria-label="Alle Aufnahmen">
          {stuecke.map((s, i) => (
            <button
              key={s.pfad}
              className={'bt-mini' + (i === index ? ' an' : '')}
              onClick={() => setIndex(i)}
              aria-label={`${i + 1}: ${s.text}`}
              aria-current={i === index ? 'true' : undefined}
              ref={(el) => { if (el && i === index) el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); }}
            >
              <img src={pfad(s.vorschau)} alt="" loading="lazy" decoding="async" />
              {s.art === 'video' && <span className="bt-mini-play" aria-hidden="true" />}
            </button>
          ))}
        </nav>
      )}
    </div>
  );

  return createPortal(inhalt, document.body);
}

function Lupe({ minus = false }: { minus?: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="9" cy="9" r="5.5" /><path d="M13 13 L17.5 17.5" />
      <path d={minus ? 'M6.5 9 H11.5' : 'M6.5 9 H11.5 M9 6.5 V11.5'} />
    </svg>
  );
}
