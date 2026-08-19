/* Ein Sternbild in Pfotenform: fuenf helle Sterne (vier Zehen, ein
   Ballen), verbunden durch eine leise wandernde Linie. Dazu ein paar
   schwaechere Sterne drumherum, damit es nicht zu geometrisch wirkt. */

type Punkt = { x: number; y: number; r: number };

const PFOTE: Punkt[] = [
  { x: 65,  y: 126, r: 5.4 },  // Ballen, mittig unten
  { x: 20,  y: 78,  r: 3.3 },  // Zehe aussen links
  { x: 44,  y: 50,  r: 3.7 },
  { x: 86,  y: 50,  r: 3.7 },
  { x: 110, y: 78,  r: 3.3 },  // Zehe aussen rechts
];

/* Die Linien laufen sternfoermig vom Ballen zu jeder Zehe. Ein
   geschlossener Streckenzug (Zehe zu Zehe) sah aus wie ein Drachen —
   erst die Strahlen machen die Pfote erkennbar. */
const STRAHLEN: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
];

const BEIWERK: Punkt[] = [
  { x: 12,  y: 24,  r: 1.5 },
  { x: 104, y: 30,  r: 1.8 },
  { x: 118, y: 116, r: 1.6 },
  { x: 8,   y: 108, r: 1.4 },
  { x: 64,  y: 16,  r: 1.7 },
  { x: 100, y: 148, r: 1.5 },
  { x: 26,  y: 152, r: 1.3 },
];

export function Sternbild({
  name,
  text,
  farbe = '#ffe3ad',
  versatz = 0,
}: {
  name: string;
  text: string;
  farbe?: string;
  versatz?: number;
}) {
  const id = `glanz-${name.toLowerCase()}`;
  return (
    <div className="sternbild">
      <svg viewBox="0 0 130 172" xmlns="http://www.w3.org/2000/svg" role="img"
           aria-label={`Sternbild in Pfotenform fuer ${name}`}>
        <defs>
          <radialGradient id={id} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={farbe} stopOpacity="0.5" />
            <stop offset="100%" stopColor={farbe} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Verbindungslinien vom Ballen zu den Zehen */}
        {STRAHLEN.map(([a, b], i) => (
          <line
            key={`l${i}`}
            className="sb-linie"
            x1={PFOTE[a].x} y1={PFOTE[a].y} x2={PFOTE[b].x} y2={PFOTE[b].y}
            stroke={farbe} strokeOpacity="0.38" strokeWidth="1" strokeLinecap="round"
            style={{ animationDelay: `${versatz + i * 0.3}s` }}
          />
        ))}

        {BEIWERK.map((s, i) => (
          <circle key={`b${i}`} cx={s.x} cy={s.y} r={s.r} fill="#fff8e9" opacity="0.42" />
        ))}

        {PFOTE.map((s, i) => (
          <g key={`p${i}`} className="sb-stern" style={{ animationDelay: `${versatz + i * 0.42}s` }}>
            <circle cx={s.x} cy={s.y} r={s.r * 4.2} fill={`url(#${id})`} />
            <circle cx={s.x} cy={s.y} r={s.r} fill="#fffdf6" />
            {/* kleiner Lichtkreuz-Effekt */}
            <path
              d={`M${s.x - s.r * 2.6} ${s.y} H${s.x + s.r * 2.6} M${s.x} ${s.y - s.r * 2.6} V${s.y + s.r * 2.6}`}
              stroke={farbe} strokeOpacity="0.55" strokeWidth="0.7" strokeLinecap="round"
            />
          </g>
        ))}
      </svg>
      <div className="sb-name">{name}</div>
      <p className="sb-text">{text}</p>
    </div>
  );
}

/* Kerze mit flackernder Flamme. */
export function Kerze() {
  return (
    <svg className="kerze" width="64" height="96" viewBox="0 0 64 96"
         xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Eine brennende Kerze">
      <defs>
        <radialGradient id="kerzen-schein" cx="50%" cy="26%" r="52%">
          <stop offset="0%"   stopColor="#ffd894" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffd894" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="flammen-verlauf" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%"   stopColor="#ff9d3c" />
          <stop offset="55%"  stopColor="#ffd06b" />
          <stop offset="100%" stopColor="#fff6d8" />
        </linearGradient>
      </defs>

      <circle cx="32" cy="26" r="30" fill="url(#kerzen-schein)" />

      {/* Wachs */}
      <rect x="22" y="44" width="20" height="46" rx="6" fill="#f6efe0" />
      <rect x="22" y="44" width="7"  height="46" rx="4" fill="#fffcf3" opacity="0.75" />
      <ellipse cx="32" cy="44" rx="10" ry="3.4" fill="#e8dcc4" />

      {/* Docht */}
      <path d="M32 44 V38" stroke="#5a4a34" strokeWidth="1.6" strokeLinecap="round" />

      {/* Flamme */}
      <path className="flamme"
            d="M32 14 C 39 24, 42 30, 39.5 35 C 37.5 39.5, 33.5 41, 32 41 C 30.5 41, 26.5 39.5, 24.5 35 C 22 30, 25 24, 32 14 Z"
            fill="url(#flammen-verlauf)" />
    </svg>
  );
}
