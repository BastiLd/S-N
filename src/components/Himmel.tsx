import { zufall } from '@/lib/pfad';

/* ------------------------------------------------------------------
   Ein Wolkenband. Dasselbe SVG steht zweimal nebeneinander und wird
   um genau seine halbe Breite verschoben — dadurch laeuft es endlos,
   ohne sichtbare Naht.
   ------------------------------------------------------------------ */
export function WolkenBand({ lage, farbe }: { lage: 'fern' | 'mitte' | 'nah'; farbe: string }) {
  const wolke = (
    <svg viewBox="0 0 1200 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <g fill={farbe}>
        <ellipse cx="150" cy="170" rx="150" ry="58" />
        <ellipse cx="255" cy="140" rx="112" ry="76" />
        <ellipse cx="360" cy="172" rx="132" ry="54" />
        <ellipse cx="620" cy="150" rx="128" ry="66" />
        <ellipse cx="726" cy="176" rx="150" ry="50" />
        <ellipse cx="520" cy="182" rx="118" ry="46" />
        <ellipse cx="960" cy="160" rx="140" ry="70" />
        <ellipse cx="1074" cy="184" rx="126" ry="48" />
        <ellipse cx="860" cy="188" rx="110" ry="42" />
      </g>
    </svg>
  );
  return (
    <div className={`wolken-band ${lage}`}>
      {wolke}
      {wolke}
    </div>
  );
}

/* Regenstriche — Positionen und Tempo sind fest vergeben, damit
   Server und Browser dasselbe rendern. */
export function Regen({ anzahl = 46 }: { anzahl?: number }) {
  const w = zufall(20260519);
  const striche = Array.from({ length: anzahl }, () => ({
    links: w() * 78,
    dauer: 0.85 + w() * 0.75,
    warten: w() * 2.2,
    hoehe: 54 + w() * 70,
    deckung: 0.28 + w() * 0.6,
  }));
  return (
    <div className="regen" aria-hidden="true">
      {striche.map((s, i) => (
        <span
          key={i}
          style={{
            left: `${s.links}%`,
            height: `${s.hoehe}px`,
            opacity: s.deckung,
            animationDuration: `${s.dauer}s`,
            animationDelay: `-${s.warten}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------
   Comic-Tornado. Der Trichter besteht aus sieben Baendern, die
   unabhaengig voneinander in der Breite pulsieren — das liest sich
   als Drehung, ohne dass etwas wirklich rotieren muss.
   Im Wirbel fliegen zwei Pfoten und zwei Blaetter mit.
   ------------------------------------------------------------------ */
export function Tornado() {
  const baender = [
    { y: 34,  rx: 118, ry: 26, o: 0.5 },
    { y: 92,  rx: 100, ry: 22, o: 0.56 },
    { y: 146, rx: 84,  ry: 19, o: 0.62 },
    { y: 196, rx: 68,  ry: 16, o: 0.68 },
    { y: 242, rx: 52,  ry: 13, o: 0.74 },
    { y: 284, rx: 37,  ry: 10, o: 0.8 },
    { y: 322, rx: 24,  ry: 8,  o: 0.88 },
  ];

  return (
    <div className="tornado-buehne">
      <svg className="tornado" viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" role="img"
           aria-label="Ein gezeichneter Wirbelsturm, in dem zwei Pfotenabdruecke mitfliegen">
        <defs>
          <linearGradient id="t-verlauf" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#dff3f5" />
            <stop offset="55%"  stopColor="#9ec9d6" />
            <stop offset="100%" stopColor="#5d8ba5" />
          </linearGradient>
          <radialGradient id="t-schein" cx="50%" cy="40%" r="60%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="150" cy="200" rx="150" ry="185" fill="url(#t-schein)" />

        <g className="tornado-huelle">
          {baender.map((b, i) => (
            <ellipse
              key={b.y}
              className={`t-band b${i + 1}`}
              cx="150" cy={b.y} rx={b.rx} ry={b.ry}
              fill="url(#t-verlauf)" opacity={b.o}
            />
          ))}
          {/* Aussenkontur des Trichters */}
          <path
            d="M32 34 C 42 130, 96 260, 138 358 L 162 358 C 204 260, 258 130, 268 34"
            fill="none" stroke="#eaf7fa" strokeOpacity="0.34" strokeWidth="2.5" strokeLinecap="round"
          />
          {/* Staubwolke am Boden */}
          <ellipse cx="150" cy="362" rx="86" ry="19" fill="#cfe6ec" opacity="0.3" />
          <ellipse cx="150" cy="368" rx="120" ry="14" fill="#cfe6ec" opacity="0.18" />
        </g>

        {/* Mitfliegendes: zwei Pfoten, zwei Blaetter */}
        <g transform="translate(150 176)">
          <g className="fliegt fliegt-1">
            <Pfote fuellung="#ffe6b8" groesse={0.9} />
          </g>
          <g className="fliegt fliegt-2">
            <Pfote fuellung="#35c9b8" groesse={0.78} />
          </g>
          <g className="fliegt fliegt-3">
            <path d="M0 0 C 9 -11, 24 -9, 27 3 C 20 13, 5 12, 0 0 Z" fill="#8fd6a6" opacity="0.85" />
          </g>
          <g className="fliegt fliegt-4">
            <path d="M0 0 C 8 -9, 20 -8, 23 2 C 17 11, 4 10, 0 0 Z" fill="#f0b478" opacity="0.8" />
          </g>
        </g>
      </svg>
    </div>
  );
}

/* Eine einzelne Pfote als fertiges Symbol. Die Pfote reicht bei
   groesse 1 von etwa -16 bis 16 in der Breite und -17 bis 20 in der
   Hoehe — der viewBox laesst genau dafuer Platz, sonst wird der Ballen
   unten abgeschnitten. */
export function PfotenSymbol({ groesse = 20, fuellung = '#ffffff' }:
  { groesse?: number; fuellung?: string }) {
  return (
    <svg width={groesse} height={groesse * 1.16} viewBox="-18 -19 36 42"
         xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <Pfote fuellung={fuellung} />
    </svg>
  );
}

/* Zwei Pfoten nebeneinander — Simba und Nala. */
export function PfotenPaar({ breite = 78, links = '#f6c97a', rechts = '#ffe3ad' }:
  { breite?: number; links?: string; rechts?: string }) {
  return (
    <svg width={breite} height={breite * 0.62} viewBox="-46 -22 92 57"
         xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"
         style={{ margin: '0 auto' }}>
      <g transform="translate(-20 2)"><Pfote fuellung={links} groesse={0.92} /></g>
      <g transform="translate(20 -3) rotate(9)"><Pfote fuellung={rechts} groesse={0.78} /></g>
    </svg>
  );
}

/* Ein Pfotenabdruck: Ballen plus vier Zehen. */
export function Pfote({ fuellung = '#ffffff', groesse = 1 }: { fuellung?: string; groesse?: number }) {
  return (
    <g transform={`scale(${groesse})`} fill={fuellung}>
      <ellipse cx="0" cy="9" rx="12" ry="10.5" />
      <ellipse cx="-11" cy="-6"  rx="4.6" ry="6" transform="rotate(-18 -11 -6)" />
      <ellipse cx="-3.8" cy="-11" rx="4.6" ry="6.4" />
      <ellipse cx="4.2"  cy="-11" rx="4.6" ry="6.4" />
      <ellipse cx="11.4" cy="-6"  rx="4.6" ry="6" transform="rotate(18 11.4 -6)" />
    </g>
  );
}

/* Huegelkette als Abschluss des Hero-Bildes. */
export function Huegel() {
  return (
    <div className="huegel" aria-hidden="true">
      <svg viewBox="0 0 1440 190" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 122 C 150 74, 268 150, 420 122 C 566 95, 686 44, 840 74 C 986 102, 1104 158, 1250 132 C 1332 118, 1392 96, 1440 88 L1440 190 L0 190 Z"
              fill="#0d2a2c" opacity="0.5" />
        <path d="M0 152 C 168 118, 300 176, 452 156 C 620 134, 742 96, 900 118 C 1058 140, 1186 182, 1330 166 C 1382 160, 1416 154, 1440 150 L1440 190 L0 190 Z"
              fill="#0a1f22" opacity="0.85" />
      </svg>
    </div>
  );
}

/* Sternenfeld fuer die dunklen Flaechen. `saat` haelt es reproduzierbar. */
export function Sterne({ anzahl = 130, saat = 1234, klasse = 'nacht-sterne' }:
  { anzahl?: number; saat?: number; klasse?: string }) {
  const w = zufall(saat);
  const sterne = Array.from({ length: anzahl }, () => ({
    x: w() * 100,
    y: w() * 100,
    r: 0.55 + w() * 1.5,
    o: 0.28 + w() * 0.66,
    d: 2.4 + w() * 4.2,
    v: w() * 5,
  }));
  return (
    <svg className={klasse} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {sterne.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r / 10} fill="#fff8e9" opacity={s.o}>
          <animate attributeName="opacity"
                   values={`${s.o};${Math.min(1, s.o + 0.4)};${s.o}`}
                   dur={`${s.d}s`} begin={`-${s.v}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}
