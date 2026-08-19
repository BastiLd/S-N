'use client';

/* ============================================================
   Bildansicht mit Zoom, Verschieben und Drehen.
   © Bastian Klaus

   Die Einpassung wird hier in JavaScript gerechnet und nicht per
   `max-height: 100%` dem Browser ueberlassen. Grund: in einem Grid mit
   `1fr`-Zeile hat die Prozentangabe keine definite Bezugsgroesse, der
   Browser behandelt sie dann wie `none` — das Bild wurde dadurch in
   voller Hoehe gerendert und sah aus wie hineingezoomt.

   Alles rechnet mit einem Faktor:
     basis  = so gross, dass das Bild genau in die Buehne passt
     zoom   = 1 bedeutet eingepasst, 2 doppelt so gross
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from 'react';

export type BildSteuerung = {
  zoom: number;
  kannZoomen: boolean;
  hinein: () => void;
  hinaus: () => void;
  zuruecksetzen: () => void;
  drehen: () => void;
};

const MAX_ZOOM = 8;
const SCHRITT = 1.5;

export function BildAnsicht({
  quelle, beschreibung, aufSteuerung, aufWisch, aufSchliessen,
}: {
  quelle: string;
  beschreibung: string;
  aufSteuerung: (s: BildSteuerung) => void;
  aufWisch: (richtung: number) => void;
  aufSchliessen: () => void;
}) {
  const buehne = useRef<HTMLDivElement>(null);
  const bild = useRef<HTMLImageElement>(null);

  const [mass, setMass] = useState({ b: 0, h: 0 });        // Buehne
  const [natur, setNatur] = useState({ b: 0, h: 0 });      // Originalgroesse
  const [zoom, setZoom] = useState(1);
  const [ver, setVer] = useState({ x: 0, y: 0 });
  const [drehung, setDrehung] = useState(0);
  const [geladen, setGeladen] = useState(false);
  /* Ob gerade gezogen oder aufgezogen wird, steht als State und nicht
     nur im Ref: waehrend des Renderns darf ein Ref nicht gelesen
     werden, und genau davon haengt hier ab, ob die Bewegung weich
     animiert wird oder dem Finger direkt folgt. */
  const [inBewegung, setInBewegung] = useState(false);

  /* Zeiger fuer Ziehen und Aufziehen */
  const zeiger = useRef(new Map<number, { x: number; y: number }>());
  const start = useRef<{ x: number; y: number; vx: number; vy: number; t: number } | null>(null);
  const kneif = useRef<{ abstand: number; zoom: number } | null>(null);
  const zieht = useRef(false);

  /* Buehnengroesse beobachten — Drehen des Geraets, Tastatur, alles. */
  useEffect(() => {
    const el = buehne.current;
    if (!el) return;
    const beobachter = new ResizeObserver(([e]) => {
      const r = e.contentRect;
      setMass({ b: Math.round(r.width), h: Math.round(r.height) });
    });
    beobachter.observe(el);
    return () => beobachter.disconnect();
  }, []);

  /* Originalgroesse ermitteln. Zuruecksetzen von Zoom und Drehung ist
     hier nicht noetig: der Betrachter gibt der Komponente den Bildpfad
     als `key`, sie wird beim Wechsel also ohnehin neu aufgebaut. Das
     Setzen des Zustands passiert im onload-Callback, nicht im Rumpf
     des Effekts — sonst gaebe es eine unnoetige zweite Renderrunde. */
  useEffect(() => {
    let lebt = true;
    const i = new Image();
    const fertig = () => {
      if (!lebt) return;
      setNatur({ b: i.naturalWidth, h: i.naturalHeight });
      setGeladen(true);
    };
    i.onload = fertig;
    i.src = quelle;
    if (i.complete && i.naturalWidth) fertig();
    return () => { lebt = false; i.onload = null; };
  }, [quelle]);

  /* ---- Groessen ---- */
  const quer = drehung % 180 !== 0;
  const sichtB = quer ? natur.h : natur.b;
  const sichtH = quer ? natur.b : natur.h;
  const basis = sichtB && sichtH && mass.b && mass.h
    ? Math.min(mass.b / sichtB, mass.h / sichtH)
    : 0;
  const breiteAufSchirm = sichtB * basis * zoom;
  const hoeheAufSchirm = sichtH * basis * zoom;

  /* Verschiebung begrenzen: das Bild darf nicht aus dem Bild wandern. */
  const grenze = useCallback((v: { x: number; y: number }, z = zoom) => {
    const bb = sichtB * basis * z;
    const hh = sichtH * basis * z;
    const maxX = Math.max(0, (bb - mass.b) / 2);
    const maxY = Math.max(0, (hh - mass.h) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, v.x)),
      y: Math.min(maxY, Math.max(-maxY, v.y)),
    };
  }, [basis, sichtB, sichtH, mass.b, mass.h, zoom]);

  /* Zoomen um einen Punkt herum (Mausrad, Doppeltipp). */
  const zoomeAuf = useCallback((neu: number, punktX = 0, punktY = 0) => {
    setZoom((alt) => {
      const z = Math.min(MAX_ZOOM, Math.max(1, neu));
      setVer((v) => {
        if (z === 1) return { x: 0, y: 0 };
        const f = z / alt;
        return grenze({ x: punktX - (punktX - v.x) * f, y: punktY - (punktY - v.y) * f }, z);
      });
      return z;
    });
  }, [grenze]);

  /* Steuerung nach oben reichen, damit die Kopfleiste sie bedienen kann. */
  useEffect(() => {
    aufSteuerung({
      zoom,
      kannZoomen: geladen,
      hinein: () => zoomeAuf(zoom * SCHRITT),
      hinaus: () => zoomeAuf(zoom / SCHRITT),
      zuruecksetzen: () => { setZoom(1); setVer({ x: 0, y: 0 }); },
      drehen: () => { setDrehung((d) => (d + 90) % 360); setZoom(1); setVer({ x: 0, y: 0 }); },
    });
  }, [zoom, geladen, zoomeAuf, aufSteuerung]);

  /* ---- Mausrad ---- */
  const rad = (e: React.WheelEvent) => {
    e.preventDefault();
    const r = buehne.current?.getBoundingClientRect();
    if (!r) return;
    const px = e.clientX - r.left - r.width / 2;
    const py = e.clientY - r.top - r.height / 2;
    zoomeAuf(zoom * (e.deltaY < 0 ? 1.22 : 1 / 1.22), px, py);
  };

  /* ---- Zeiger ---- */
  const runter = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    zeiger.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (zeiger.current.size === 2) {
      const [a, b] = [...zeiger.current.values()];
      kneif.current = { abstand: Math.hypot(a.x - b.x, a.y - b.y), zoom };
      zieht.current = false;
    } else {
      start.current = { x: e.clientX, y: e.clientY, vx: ver.x, vy: ver.y, t: Date.now() };
      zieht.current = true;
    }
    setInBewegung(true);
  };

  const bewegt = (e: React.PointerEvent) => {
    if (!zeiger.current.has(e.pointerId)) return;
    zeiger.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (zeiger.current.size === 2 && kneif.current) {
      const [a, b] = [...zeiger.current.values()];
      const jetzt = Math.hypot(a.x - b.x, a.y - b.y);
      zoomeAuf(kneif.current.zoom * (jetzt / kneif.current.abstand));
      return;
    }
    if (!zieht.current || !start.current || zoom <= 1.001) return;
    setVer(grenze({
      x: start.current.vx + (e.clientX - start.current.x),
      y: start.current.vy + (e.clientY - start.current.y),
    }));
  };

  const hoch = (e: React.PointerEvent) => {
    const s = start.current;
    zeiger.current.delete(e.pointerId);
    if (zeiger.current.size < 2) kneif.current = null;
    if (zeiger.current.size > 0 || !s) { start.current = null; return; }
    start.current = null;
    zieht.current = false;
    setInBewegung(false);

    /* Ohne Zoom ist eine waagrechte Bewegung ein Wisch, eine kraeftige
       senkrechte nach unten schliesst. */
    if (zoom > 1.001) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    const dauer = Date.now() - s.t;
    const schnell = dauer < 500;
    if (Math.abs(dx) > (schnell ? 45 : 80) && Math.abs(dx) > Math.abs(dy) * 1.4) aufWisch(dx < 0 ? 1 : -1);
    else if (dy > 110 && Math.abs(dy) > Math.abs(dx) * 1.4) aufSchliessen();
  };

  /* ---- Doppeltipp / Doppelklick ---- */
  const letzterTipp = useRef(0);
  const doppelt = (e: React.MouseEvent) => {
    const r = buehne.current?.getBoundingClientRect();
    if (!r) return;
    if (zoom > 1.001) { setZoom(1); setVer({ x: 0, y: 0 }); return; }
    zoomeAuf(2.5, e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2);
  };

  return (
    <div
      className={'ba' + (zoom > 1.001 ? ' gezoomt' : '')}
      ref={buehne}
      onWheel={rad}
      onPointerDown={runter}
      onPointerMove={bewegt}
      onPointerUp={hoch}
      onPointerCancel={hoch}
      onDoubleClick={doppelt}
      onClick={(e) => {
        /* Doppeltipp am Finger: zwei Klicks kurz hintereinander. */
        const jetzt = Date.now();
        if (jetzt - letzterTipp.current < 300) { doppelt(e); letzterTipp.current = 0; }
        else letzterTipp.current = jetzt;
      }}
    >
      {!geladen && <span className="ba-laedt" aria-label="Bild wird geladen" />}
      {basis > 0 && (
        <img
          ref={bild}
          className="ba-bild"
          src={quelle}
          alt={beschreibung}
          draggable={false}
          style={{
            width: (quer ? sichtH : sichtB) * basis * zoom,
            height: (quer ? sichtB : sichtH) * basis * zoom,
            transform: `translate3d(${ver.x}px, ${ver.y}px, 0) rotate(${drehung}deg)`,
            transition: inBewegung
              ? 'none'
              : 'transform .25s cubic-bezier(.2,.85,.3,1), width .25s, height .25s',
          }}
        />
      )}
      {zoom > 1.001 && (
        <span className="ba-stufe" aria-hidden="true">{Math.round(zoom * 100)} %</span>
      )}
      <span className="sr-only" aria-live="polite">
        {geladen ? `${Math.round(breiteAufSchirm)} mal ${Math.round(hoeheAufSchirm)} Pixel angezeigt` : ''}
      </span>
    </div>
  );
}
