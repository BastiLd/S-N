'use client';

/* ============================================================
   Grossansicht fuer Bilder und Videos.  © Bastian Klaus

   Bedienung
     Maus      Rad = zoomen, ziehen = verschieben, Doppelklick = 1:1
     Finger    wischen = blaettern, aufziehen = zoomen, ziehen = schieben
     Tastatur  ← →  blaettern      Esc  schliessen
               i    Infos          + −  zoomen        0  zuruecksetzen
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { pfad } from '@/lib/pfad';
import {
  type Stueck, datumLang, groesse, dauerText, megapixel,
  sichtbarerOrt, koordinaten, metaSchluessel,
} from '@/lib/medien';
import { RECHTE } from '@/lib/einstellungen';
import { useGeheimnis } from '@/lib/geheim';
import { Schloss } from './Schloss';

const MAX_ZOOM = 5;

type Sicht = { z: number; x: number; y: number };
const ZURUECK: Sicht = { z: 1, x: 0, y: 0 };

export function Betrachter({
  stuecke, index, setIndex, onSchliessen,
}: {
  stuecke: Stueck[];
  index: number;
  setIndex: (i: number) => void;
  onSchliessen: () => void;
}) {
  const [sicht, setSicht] = useState<Sicht>(ZURUECK);
  const [infoOffen, setInfoOffen] = useState(false);
  /* Der Betrachter steht im Markup innerhalb von .nacht, und das hat
     `isolation: isolate` (noetig fuer Sterne, Mond und Wolken mit
     negativem z-index). Dadurch gilt das z-index des Betrachters nur
     INNERHALB dieses Bereichs — die Kopfzeile der Seite lag darueber
     und schluckte die Klicks. Ein Portal an <body> holt ihn heraus. */
  const [bereit, setBereit] = useState(false);
  useEffect(() => { setBereit(true); }, []);
  const buehne = useRef<HTMLDivElement>(null);
  const tresor = useGeheimnis();
  const zieht = useRef<{ x: number; y: number; sx: number; sy: number } | null>(null);
  const zeiger = useRef(new Map<number, { x: number; y: number }>());
  const kneifAbstand = useRef(0);

  const aktuell = stuecke[index];
  const gezoomt = sicht.z > 1.01;

  const weiter = useCallback((r: number) => {
    setIndex((index + r + stuecke.length) % stuecke.length);
  }, [index, stuecke.length, setIndex]);

  /* Beim Wechsel wieder auf Anfang — sonst bleibt der naechste Blick
     im Zoom des vorigen haengen. */
  useEffect(() => { setSicht(ZURUECK); }, [index]);

  /* Nachbarn vorladen, damit das Blaettern nicht flackert. */
  useEffect(() => {
    for (const r of [1, -1]) {
      const n = stuecke[(index + r + stuecke.length) % stuecke.length];
      if (n && n.art === 'bild') { const i = new Image(); i.src = pfad(n.pfad); }
    }
  }, [index, stuecke]);

  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': onSchliessen(); break;
        case 'ArrowRight': weiter(1); break;
        case 'ArrowLeft': weiter(-1); break;
        case 'i': case 'I': setInfoOffen((o) => !o); break;
        case '+': case '=': setSicht((s) => ({ ...s, z: Math.min(MAX_ZOOM, s.z * 1.4) })); break;
        case '-': case '_': setSicht((s) => (s.z / 1.4 <= 1 ? ZURUECK : { ...s, z: s.z / 1.4 })); break;
        case '0': setSicht(ZURUECK); break;
      }
    };
    window.addEventListener('keydown', taste);
    const vorher = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', taste);
      document.body.style.overflow = vorher;
    };
  }, [weiter, onSchliessen]);

  /* ---------- Zoom mit dem Mausrad, auf den Zeiger zentriert ---------- */
  const rad = (e: React.WheelEvent) => {
    if (aktuell.art !== 'bild') return;
    e.preventDefault();
    const kasten = buehne.current?.getBoundingClientRect();
    if (!kasten) return;
    const mx = e.clientX - kasten.left - kasten.width / 2;
    const my = e.clientY - kasten.top - kasten.height / 2;
    setSicht((s) => {
      const z = Math.min(MAX_ZOOM, Math.max(1, s.z * (e.deltaY < 0 ? 1.18 : 1 / 1.18)));
      if (z === 1) return ZURUECK;
      /* Der Punkt unter dem Zeiger soll unter dem Zeiger bleiben. */
      const f = z / s.z;
      return { z, x: mx - (mx - s.x) * f, y: my - (my - s.y) * f };
    });
  };

  /* ---------- Ziehen, Wischen und Aufziehen ---------- */
  const runter = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    zeiger.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (zeiger.current.size === 2) {
      const [a, b] = [...zeiger.current.values()];
      kneifAbstand.current = Math.hypot(a.x - b.x, a.y - b.y);
    } else {
      zieht.current = { x: e.clientX, y: e.clientY, sx: sicht.x, sy: sicht.y };
    }
  };

  const bewegt = (e: React.PointerEvent) => {
    if (!zeiger.current.has(e.pointerId)) return;
    zeiger.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (zeiger.current.size === 2) {
      const [a, b] = [...zeiger.current.values()];
      const abstand = Math.hypot(a.x - b.x, a.y - b.y);
      if (kneifAbstand.current > 0) {
        const f = abstand / kneifAbstand.current;
        setSicht((s) => {
          const z = Math.min(MAX_ZOOM, Math.max(1, s.z * f));
          return z === 1 ? ZURUECK : { ...s, z };
        });
      }
      kneifAbstand.current = abstand;
      return;
    }

    if (!zieht.current || !gezoomt) return;
    setSicht((s) => ({
      ...s,
      x: zieht.current!.sx + (e.clientX - zieht.current!.x),
      y: zieht.current!.sy + (e.clientY - zieht.current!.y),
    }));
  };

  const hoch = (e: React.PointerEvent) => {
    const start = zieht.current;
    zeiger.current.delete(e.pointerId);
    if (zeiger.current.size < 2) kneifAbstand.current = 0;
    zieht.current = null;
    if (!start || gezoomt || zeiger.current.size > 0) return;

    /* Ohne Zoom ist eine waagrechte Bewegung ein Wisch zum Blaettern. */
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) weiter(dx < 0 ? 1 : -1);
    else if (dy > 110 && Math.abs(dy) > Math.abs(dx) * 1.5) onSchliessen();
  };

  const doppelt = () => {
    if (aktuell.art !== 'bild') return;
    setSicht((s) => (s.z > 1.01 ? ZURUECK : { z: 2.5, x: 0, y: 0 }));
  };

  /* Die Aufnahmedaten liegen verschluesselt neben der Seite und sind
     erst nach dem Aufschliessen da. */
  const m = tresor.daten?.[metaSchluessel(aktuell)] ?? null;
  const ort = sichtbarerOrt(m?.ort);

  if (!bereit) return null;

  const inhalt = (
    <div className="bt" role="dialog" aria-modal="true" aria-label={aktuell.text}>
      {/* ---------- Kopfleiste ---------- */}
      <div className="bt-kopf">
        <div className="bt-titel">
          <span className="bt-text">{aktuell.text}</span>
          <span className="bt-zaehler">{index + 1} / {stuecke.length}</span>
        </div>
        <div className="bt-knoepfe">
          {aktuell.art === 'bild' && (
            <button className={'bt-knopf' + (gezoomt ? ' an' : '')}
                    onClick={() => setSicht((s) => (s.z > 1.01 ? ZURUECK : { z: 2.5, x: 0, y: 0 }))}
                    aria-label={gezoomt ? 'Zoom zurücksetzen' : 'Vergrößern'} title="Zoom (Doppelklick, Mausrad)">
              <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="9" cy="9" r="5.5" /><path d="M13 13 L17.5 17.5" />
                <path d={gezoomt ? 'M6.5 9 H11.5' : 'M6.5 9 H11.5 M9 6.5 V11.5'} />
              </svg>
            </button>
          )}
          {tresor.vorhanden !== false && (
            <button className={'bt-knopf' + (infoOffen ? ' an' : '')}
                    onClick={() => setInfoOffen((o) => !o)}
                    aria-label="Informationen" aria-pressed={infoOffen} title="Infos (Taste i)">
              <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="10" cy="10" r="8" /><path d="M10 9 V14" /><circle cx="10" cy="6.2" r="1.1" fill="currentColor" stroke="none" />
              </svg>
            </button>
          )}
          <button className="bt-knopf" onClick={onSchliessen} aria-label="Schließen" title="Schließen (Esc)">
            <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M4.5 4.5 L15.5 15.5 M15.5 4.5 L4.5 15.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* ---------- Bühne ---------- */}
      <div
        className={'bt-buehne' + (gezoomt ? ' gezoomt' : '')}
        ref={buehne}
        onWheel={rad}
        onPointerDown={runter}
        onPointerMove={bewegt}
        onPointerUp={hoch}
        onPointerCancel={hoch}
        onDoubleClick={doppelt}
        onClick={(e) => { if (e.target === buehne.current && !gezoomt) onSchliessen(); }}
      >
        {aktuell.art === 'bild' ? (
          <img
            key={aktuell.pfad}
            className="bt-bild"
            src={pfad(aktuell.pfad)}
            alt={aktuell.text}
            draggable={false}
            style={{
              transform: `translate3d(${sicht.x}px, ${sicht.y}px, 0) scale(${sicht.z})`,
              transition: zieht.current ? 'none' : 'transform .22s cubic-bezier(.2,.8,.3,1)',
            }}
          />
        ) : (
          <video
            key={aktuell.pfad}
            className="bt-video"
            src={pfad(aktuell.pfad)}
            poster={pfad(aktuell.vorschau)}
            controls autoPlay playsInline preload="auto"
          />
        )}

        {stuecke.length > 1 && (
          <>
            <button className="bt-pfeil links" onClick={(e) => { e.stopPropagation(); weiter(-1); }} aria-label="Vorheriges">
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.5 4 L6 10 L12.5 16" /></svg>
            </button>
            <button className="bt-pfeil rechts" onClick={(e) => { e.stopPropagation(); weiter(1); }} aria-label="Nächstes">
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 4 L14 10 L7.5 16" /></svg>
            </button>
          </>
        )}
      </div>

      {/* ---------- Info-Tafel ---------- */}
      {infoOffen && !tresor.offen && (
        <aside className="bt-info" onClick={(e) => e.stopPropagation()}>
          <Schloss
            titel="Aufnahmedaten"
            text="Kamera, Zeitpunkt und Ort sind verschlüsselt. Mit dem Passwort werden sie hier im Browser aufgeschlossen."
            laeuft={tresor.laeuft}
            fehler={tresor.fehler}
            onAufschliessen={tresor.aufschliessen}
          />
        </aside>
      )}

      {infoOffen && tresor.offen && !m && (
        <aside className="bt-info" onClick={(e) => e.stopPropagation()}>
          <h3>Aufnahme</h3>
          <p className="bt-rechte">Zu dieser Datei sind keine Aufnahmedaten hinterlegt.</p>
        </aside>
      )}

      {infoOffen && m && (
        <aside className="bt-info" onClick={(e) => e.stopPropagation()}>
          <h3>Aufnahme</h3>
          <dl>
            <Zeile k="Aufgenommen" w={datumLang(m.aufgenommen)} />
            <Zeile k="Ort" w={ort?.name} />
            <Zeile k="Koordinaten" w={ort ? koordinaten(ort) : null} />
            <Zeile k="Höhe" w={ort?.hoehe ? `${ort.hoehe} m` : null} />
            <Zeile k="Kamera" w={m.kamera} />
            <Zeile k="Objektiv" w={m.objektiv} />
            {m.art === 'bild' ? (
              <>
                <Zeile k="Blende" w={m.blende ? `f/${m.blende}` : null} />
                <Zeile k="Belichtung" w={m.belichtung} />
                <Zeile k="ISO" w={m.iso} />
                <Zeile k="Brennweite" w={m.brennweite ? `${m.brennweite} mm${m.brennweiteKB ? ` (KB ${m.brennweiteKB} mm)` : ''}` : null} />
              </>
            ) : (
              <>
                <Zeile k="Länge" w={dauerText(m.dauer)} />
                <Zeile k="Bildrate" w={m.bilderProSekunde ? `${m.bilderProSekunde} B/s` : null} />
                <Zeile k="Codec (Original)" w={m.codec?.toUpperCase()} />
                <Zeile k="Datenrate" w={m.bitrate ? `${Math.round(m.bitrate / 1000)} Mbit/s` : null} />
                <Zeile k="Ton" w={m.ton?.toUpperCase()} />
              </>
            )}
            <Zeile k="Auflösung" w={megapixel(m.breite, m.hoehe)} />
            <Zeile k="Original" w={groesse(m.bytes)} />
          </dl>
          {ort && (
            <a className="bt-osm"
               href={`https://www.openstreetmap.org/?mlat=${ort.lat}&mlon=${ort.lon}#map=14/${ort.lat}/${ort.lon}`}
               target="_blank" rel="noreferrer">
              Auf OpenStreetMap ansehen ↗
            </a>
          )}
          <p className="bt-rechte">
            {RECHTE}
            <button className="bt-zu-schliessen" onClick={tresor.abschliessen}>
              wieder abschließen
            </button>
          </p>
        </aside>
      )}

      {/* ---------- Streifen mit Vorschaubildern ---------- */}
      {stuecke.length > 1 && (
        <div className="bt-streifen">
          {stuecke.map((s, i) => (
            <button
              key={s.pfad}
              className={'bt-mini' + (i === index ? ' an' : '')}
              onClick={() => setIndex(i)}
              aria-label={s.text}
              aria-current={i === index}
              ref={(el) => { if (el && i === index) el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); }}
            >
              <img src={pfad(s.vorschau)} alt="" loading="lazy" />
              {s.art === 'video' && <span className="bt-mini-play" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return createPortal(inhalt, document.body);
}

function Zeile({ k, w }: { k: string; w: string | number | null | undefined }) {
  if (w === null || w === undefined || w === '') return null;
  return (
    <>
      <dt>{k}</dt>
      <dd>{w}</dd>
    </>
  );
}
