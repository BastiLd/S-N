'use client';

/* ============================================================
   Videoansicht mit eigener Steuerung.  © Bastian Klaus

   Die eingebaute Browser-Leiste sieht in jedem Browser anders aus,
   laesst sich nicht gestalten und kennt weder Tempo noch Bild-im-Bild
   an derselben Stelle. Deshalb hier eine eigene.

   Tastatur
     Leertaste / k   Abspielen und Pause
     j / l           10 Sekunden zurueck und vor
     ← / →           5 Sekunden zurueck und vor
     ↑ / ↓           lauter und leiser
     m               stumm
     f               Vollbild
     0 – 9           an die Stelle springen (0 % bis 90 %)
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from 'react';

const TEMPI = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

function zeit(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const st = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sek = Math.floor(s % 60);
  return st > 0
    ? `${st}:${String(m).padStart(2, '0')}:${String(sek).padStart(2, '0')}`
    : `${m}:${String(sek).padStart(2, '0')}`;
}

export function VideoAnsicht({
  quelle, standbild, beschreibung, aufWisch, aufSchliessen,
}: {
  quelle: string;
  standbild: string;
  beschreibung: string;
  aufWisch: (richtung: number) => void;
  aufSchliessen: () => void;
}) {
  const huelle = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const leiste = useRef<HTMLDivElement>(null);

  const [laeuft, setLaeuft] = useState(false);
  const [jetzt, setJetzt] = useState(0);
  const [dauer, setDauer] = useState(0);
  const [geladen, setGeladen] = useState(0);
  const [lautstaerke, setLautstaerke] = useState(1);
  const [stumm, setStumm] = useState(false);
  const [tempo, setTempo] = useState(1);
  const [tempoOffen, setTempoOffen] = useState(false);
  const [schleife, setSchleife] = useState(false);
  const [puffert, setPuffert] = useState(true);
  const [vollbild, setVollbild] = useState(false);
  const [steuerungSichtbar, setSteuerungSichtbar] = useState(true);
  const [schwebe, setSchwebe] = useState<{ x: number; t: number } | null>(null);

  const versteckUhr = useRef<number | null>(null);
  const zieht = useRef(false);

  /* ---------- Steuerung ein-/ausblenden ---------- */
  const zeigen = useCallback(() => {
    setSteuerungSichtbar(true);
    if (versteckUhr.current) window.clearTimeout(versteckUhr.current);
    versteckUhr.current = window.setTimeout(() => {
      if (video.current && !video.current.paused && !tempoOffen) setSteuerungSichtbar(false);
    }, 2600);
  }, [tempoOffen]);

  /* Beim Aufbauen laeuft der Verstecken-Zeitgeber an. Zuruecksetzen bei
     einem Videowechsel ist nicht noetig: der Betrachter gibt der
     Komponente die Quelle als `key`, sie wird also neu aufgebaut. */
  useEffect(() => {
    const uhr = window.setTimeout(() => {
      if (video.current && !video.current.paused) setSteuerungSichtbar(false);
    }, 2600);
    return () => {
      window.clearTimeout(uhr);
      if (versteckUhr.current) window.clearTimeout(versteckUhr.current);
    };
  }, []);

  useEffect(() => { if (video.current) video.current.playbackRate = tempo; }, [tempo, quelle]);
  useEffect(() => { if (video.current) { video.current.volume = lautstaerke; video.current.muted = stumm; } }, [lautstaerke, stumm]);

  /* ---------- Bedienung ---------- */
  const umschalten = useCallback(() => {
    const v = video.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
    zeigen();
  }, [zeigen]);

  const springen = useCallback((sekunden: number) => {
    const v = video.current;
    if (!v || !Number.isFinite(v.duration)) return;
    v.currentTime = Math.min(v.duration, Math.max(0, v.currentTime + sekunden));
    zeigen();
  }, [zeigen]);

  const aufStelle = useCallback((anteil: number) => {
    const v = video.current;
    if (!v || !Number.isFinite(v.duration)) return;
    v.currentTime = Math.min(v.duration, Math.max(0, anteil * v.duration));
    zeigen();
  }, [zeigen]);

  const vollbildUm = useCallback(async () => {
    if (!huelle.current) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await huelle.current.requestFullscreen();
    } catch { /* manche Browser erlauben es nicht */ }
  }, []);

  useEffect(() => {
    const f = () => setVollbild(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', f);
    return () => document.removeEventListener('fullscreenchange', f);
  }, []);

  const bildImBild = async () => {
    const v = video.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch { /* nicht ueberall vorhanden */ }
  };

  /* ---------- Tastatur ---------- */
  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      const ziel = e.target as HTMLElement;
      if (ziel?.tagName === 'INPUT' || ziel?.tagName === 'TEXTAREA') return;
      switch (e.key) {
        case ' ': case 'k': case 'K': e.preventDefault(); umschalten(); break;
        case 'j': case 'J': e.preventDefault(); springen(-10); break;
        case 'l': case 'L': e.preventDefault(); springen(10); break;
        case 'ArrowUp': e.preventDefault(); setLautstaerke((v) => Math.min(1, v + 0.1)); setStumm(false); zeigen(); break;
        case 'ArrowDown': e.preventDefault(); setLautstaerke((v) => Math.max(0, v - 0.1)); zeigen(); break;
        case 'm': case 'M': setStumm((s) => !s); zeigen(); break;
        case 'f': case 'F': vollbildUm(); break;
        default:
          if (/^[0-9]$/.test(e.key)) { e.preventDefault(); aufStelle(Number(e.key) / 10); }
      }
    };
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, [umschalten, springen, aufStelle, vollbildUm, zeigen]);

  /* ---------- Zeitleiste ---------- */
  const anteilAus = (klientX: number) => {
    const r = leiste.current?.getBoundingClientRect();
    if (!r || r.width === 0) return 0;
    return Math.min(1, Math.max(0, (klientX - r.left) / r.width));
  };

  const leisteRunter = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    zieht.current = true;
    aufStelle(anteilAus(e.clientX));
  };
  const leisteBewegt = (e: React.PointerEvent) => {
    const a = anteilAus(e.clientX);
    const r = leiste.current?.getBoundingClientRect();
    if (r) setSchwebe({ x: a * r.width, t: a * dauer });
    if (zieht.current) aufStelle(a);
  };
  const leisteHoch = () => { zieht.current = false; };

  /* ---------- Wischen auf dem Video ---------- */
  const wischStart = useRef<{ x: number; y: number; t: number } | null>(null);

  const anteil = dauer > 0 ? jetzt / dauer : 0;

  return (
    <div
      className={'va' + (steuerungSichtbar ? ' zeigt' : '') + (vollbild ? ' vollbild' : '')}
      ref={huelle}
      onPointerMove={zeigen}
      onPointerDown={(e) => { wischStart.current = { x: e.clientX, y: e.clientY, t: Date.now() }; }}
      onPointerUp={(e) => {
        const s = wischStart.current; wischStart.current = null;
        if (!s) return;
        const dx = e.clientX - s.x, dy = e.clientY - s.y;
        if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.4) aufWisch(dx < 0 ? 1 : -1);
        else if (dy > 120 && Math.abs(dy) > Math.abs(dx) * 1.4) aufSchliessen();
      }}
    >
      <video
        ref={video}
        className="va-video"
        src={quelle}
        poster={standbild}
        playsInline
        preload="metadata"
        loop={schleife}
        aria-label={beschreibung}
        onClick={umschalten}
        onDoubleClick={vollbildUm}
        onPlay={() => { setLaeuft(true); zeigen(); }}
        onPause={() => { setLaeuft(false); setSteuerungSichtbar(true); }}
        onTimeUpdate={(e) => setJetzt(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDauer(e.currentTarget.duration)}
        onLoadedMetadata={(e) => { setDauer(e.currentTarget.duration); setPuffert(false); }}
        onWaiting={() => setPuffert(true)}
        onPlaying={() => setPuffert(false)}
        onCanPlay={() => setPuffert(false)}
        onProgress={(e) => {
          const v = e.currentTarget;
          if (v.buffered.length) setGeladen(v.buffered.end(v.buffered.length - 1));
        }}
      />

      {puffert && <span className="va-laedt" aria-label="Video wird geladen" />}

      {!laeuft && !puffert && (
        <button className="va-start" onClick={umschalten} aria-label="Abspielen">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3.5 L20 12 L6 20.5 Z" /></svg>
        </button>
      )}

      {/* ---------- Steuerleiste ---------- */}
      <div className="va-leiste" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
        <div
          className="va-zeit"
          ref={leiste}
          onPointerDown={leisteRunter}
          onPointerMove={leisteBewegt}
          onPointerUp={leisteHoch}
          onPointerLeave={() => setSchwebe(null)}
          role="slider"
          aria-label="Position"
          aria-valuemin={0}
          aria-valuemax={Math.round(dauer)}
          aria-valuenow={Math.round(jetzt)}
          aria-valuetext={`${zeit(jetzt)} von ${zeit(dauer)}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') { e.preventDefault(); springen(5); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); springen(-5); }
          }}
        >
          <span className="va-zeit-spur" />
          <span className="va-zeit-geladen" style={{ width: `${dauer ? (geladen / dauer) * 100 : 0}%` }} />
          <span className="va-zeit-voll" style={{ width: `${anteil * 100}%` }} />
          <span className="va-zeit-knopf" style={{ left: `${anteil * 100}%` }} />
          {schwebe && (
            <span className="va-zeit-schild" style={{ left: schwebe.x }}>{zeit(schwebe.t)}</span>
          )}
        </div>

        <div className="va-knoepfe">
          <button onClick={umschalten} aria-label={laeuft ? 'Pause' : 'Abspielen'} title="Leertaste">
            {laeuft
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4.5" width="4" height="15" rx="1.2" /><rect x="14" y="4.5" width="4" height="15" rx="1.2" /></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 4 L19 12 L6.5 20 Z" /></svg>}
          </button>

          <button onClick={() => springen(-10)} aria-label="10 Sekunden zurück" title="Taste j">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 L5.5 9.5 L11 14" /><path d="M5.5 9.5 H14a5 5 0 0 1 0 10h-3" />
            </svg>
            <span className="va-zahl">10</span>
          </button>
          <button onClick={() => springen(10)} aria-label="10 Sekunden vor" title="Taste l">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 5 L18.5 9.5 L13 14" /><path d="M18.5 9.5 H10a5 5 0 0 0 0 10h3" />
            </svg>
            <span className="va-zahl">10</span>
          </button>

          <span className="va-uhr">{zeit(jetzt)} <i>/</i> {zeit(dauer)}</span>

          <span className="va-luft" />

          <div className="va-ton">
            <button onClick={() => setStumm((s) => !s)} aria-label={stumm ? 'Ton an' : 'Stumm'} title="Taste m">
              {stumm || lautstaerke === 0
                ? <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none"/><path d="M16.5 9.5 L21 14 M21 9.5 L16.5 14" /></svg>
                : <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none"/><path d="M16.5 9.5a3.5 3.5 0 0 1 0 5M19 7a7 7 0 0 1 0 10" /></svg>}
            </button>
            <input
              className="va-regler" type="range" min={0} max={1} step={0.02}
              value={stumm ? 0 : lautstaerke}
              onChange={(e) => { setLautstaerke(Number(e.target.value)); setStumm(Number(e.target.value) === 0); }}
              aria-label="Lautstärke"
              style={{ ['--anteil' as string]: `${(stumm ? 0 : lautstaerke) * 100}%` }}
            />
          </div>

          <div className="va-tempo">
            <button onClick={() => setTempoOffen((o) => !o)} aria-label="Geschwindigkeit" aria-expanded={tempoOffen} className={tempo !== 1 ? 'an' : ''}>
              {tempo}×
            </button>
            {tempoOffen && (
              <ul className="va-tempo-liste" role="menu">
                {TEMPI.map((t) => (
                  <li key={t}>
                    <button role="menuitemradio" aria-checked={t === tempo}
                            className={t === tempo ? 'an' : ''}
                            onClick={() => { setTempo(t); setTempoOffen(false); }}>
                      {t}×{t === 1 ? ' (normal)' : ''}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button onClick={() => setSchleife((s) => !s)} aria-label="Wiederholen" aria-pressed={schleife} className={schleife ? 'an' : ''}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 2.5 L20.5 6 L17 9.5" /><path d="M20.5 6H7a4 4 0 0 0-4 4v1" />
              <path d="M7 21.5 L3.5 18 L7 14.5" /><path d="M3.5 18H17a4 4 0 0 0 4-4v-1" />
            </svg>
          </button>

          <button onClick={bildImBild} aria-label="Bild im Bild" className="va-nur-gross">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
              <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><rect x="12" y="11" width="8" height="7" rx="1.5" fill="currentColor" />
            </svg>
          </button>

          <button onClick={vollbildUm} aria-label={vollbild ? 'Vollbild beenden' : 'Vollbild'} title="Taste f">
            {vollbild
              ? <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 3.5v5.5H3.5M15 3.5v5.5h5.5M9 20.5V15H3.5M15 20.5V15h5.5" /></svg>
              : <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3.5 9V3.5H9M20.5 9V3.5H15M3.5 15v5.5H9M20.5 15v5.5H15" /></svg>}
          </button>
        </div>
      </div>
    </div>
  );
}
