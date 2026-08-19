import Link from 'next/link';
import { WolkenBand, Regen, Tornado, Huegel, Sterne, PfotenSymbol, PfotenPaar } from '@/components/Himmel';
import { TAILSCALE_ADRESSE, HEIM_ADRESSE, VETNOW_WEB } from '@/lib/zugaenge';
import { pfad } from '@/lib/pfad';
import medien from '@/data/medien.json';

/* Ein Foto als Hintergrund fuer den Gedenk-Abschnitt. Ist es (noch)
   nicht da, bleibt der Abschnitt einfach der Sternenhimmel. */
const BRUECKENBILD = 'img_20170608_140304';

const BRANCHES = [
  {
    name: 'alles',
    titel: 'Alles zusammen',
    text: 'VetNow komplett — Web, Handy, Extension, Studio, Docker — dazu beide Pfotennotruf-Fassungen.',
    fuss: 'git checkout alles',
  },
  {
    name: 'vetnow-app',
    titel: 'Nur die Apps',
    text: 'VetNow ohne Studio und ohne Docker: Website und PWA, Handy-App mit Expo, Chrome-Erweiterung.',
    fuss: 'git checkout vetnow-app',
  },
  {
    name: 'pages',
    titel: 'Diese Seite',
    text: 'Der Quellcode der Seite, die du gerade liest. Next.js als statischer Export, gebaut von GitHub Actions.',
    fuss: 'git checkout pages',
  },
  {
    name: 'main',
    titel: 'Die Idee',
    text: 'Bleibt bewusst leer — dort steht nur, worum es überhaupt geht.',
    fuss: 'git checkout main',
  },
];

export default function Start() {
  const bruecke = medien.bilder.find((b) => b.id === BRUECKENBILD);

  return (
    <>
      {/* ================= Hero ================= */}
      <section className="szene">
        <div className="szene-himmel" aria-hidden="true" />
        <div className="szene-licht" aria-hidden="true" />
        <Regen />
        <div className="wolken" aria-hidden="true">
          <WolkenBand lage="fern"  farbe="#dfeef2" />
          <WolkenBand lage="mitte" farbe="#eef7f8" />
          <WolkenBand lage="nah"   farbe="#ffffff" />
        </div>
        <Huegel />

        <div className="hero-inhalt">
          <div className="wrap">
            <div className="hero-grid">
              <div>
                <span className="eyebrow" style={{ color: '#9fe6dc' }}>Simba &amp; Nala</span>
                <h1 className="hero-titel" style={{ marginTop: 16 }}>
                  Wenn es zählt,
                  <span className="zeile-2">zählt jede Minute.</span>
                </h1>
                <p className="lead hero-lead">
                  Ein Tier geht es plötzlich schlecht, und man sitzt da und weiß
                  nicht, wen man anrufen soll. Genau dafür ist all das hier
                  gebaut: schneller zur richtigen Praxis, mit tagesaktuellem
                  Status statt Rätselraten.
                </p>

                <div className="hero-knoepfe">
                  <a className="btn btn-primary" href={HEIM_ADRESSE}>
                    VetNow auf dem Server öffnen
                    <Rechts />
                  </a>
                  <Link className="btn btn-glas" href="/gedenken">
                    <PfotenSymbol groesse={17} fuellung="#ffe3ad" />
                    Für Simba &amp; Nala
                  </Link>
                </div>

                <p className="hero-notiz">
                  <span className="punkt" aria-hidden="true" />
                  Der Server läuft auf ZimaOS im Heimnetz — von unterwegs über Tailscale.
                </p>
              </div>

              <Tornado />
            </div>
          </div>
        </div>
      </section>

      {/* ================= Zugänge ================= */}
      <section className="abschnitt" id="zugaenge">
        <div className="wrap">
          <div className="abschnitt-kopf">
            <span className="eyebrow">Wo es läuft</span>
            <h2>Drei Wege hinein</h2>
            <p>
              Die eigentliche App liegt auf dem ZimaOS-Server. Diese Seite hier
              ist nur die Tür davor — sie liegt auf GitHub Pages und ist immer
              erreichbar, auch wenn der Server gerade schläft.
            </p>
          </div>

          <div className="zugaenge">
            <a className="zugang" href={HEIM_ADRESSE}>
              <span className="zugang-ic" aria-hidden="true"><IconHaus /></span>
              <span>
                <h3>Zuhause im WLAN</h3>
                <p>Das VetNow Studio direkt auf dem ZimaOS-Server. Funktioniert, solange du im selben Netz bist.</p>
                <span className="adresse">{HEIM_ADRESSE}</span>
              </span>
            </a>

            {TAILSCALE_ADRESSE ? (
              <a className="zugang" href={TAILSCALE_ADRESSE}>
                <span className="zugang-ic" aria-hidden="true"><IconGlobus /></span>
                <span>
                  <h3>Unterwegs über Tailscale</h3>
                  <p>Derselbe Server, von überall — Tailscale am Handy einschalten, fertig.</p>
                  <span className="adresse">{TAILSCALE_ADRESSE}</span>
                </span>
              </a>
            ) : (
              <div className="zugang" style={{ cursor: 'default' }}>
                <span className="zugang-ic" aria-hidden="true"><IconGlobus /></span>
                <span>
                  <h3>Unterwegs über Tailscale</h3>
                  <p>
                    Noch nicht eingetragen. Adresse am Server mit <code>tailscale ip -4</code> ablesen
                    und in <code>src/lib/zugaenge.ts</code> eintragen — dann erscheint hier der Link.
                  </p>
                  <span className="adresse">http://100.x.y.z:3000</span>
                </span>
              </div>
            )}

            <a className="zugang" href={VETNOW_WEB}>
              <span className="zugang-ic" aria-hidden="true"><IconWeb /></span>
              <span>
                <h3>Öffentliche Fassung</h3>
                <p>VetNow als Website und installierbare PWA — die saubere Version ohne Testdaten.</p>
                <span className="adresse">{VETNOW_WEB}</span>
              </span>
            </a>
          </div>

          <p className="hinweis">
            Die beiden ersten Adressen zeigen ins Heimnetz. Wer nicht dort ist
            (und kein Tailscale an hat), landet auf einer Fehlerseite — das ist
            kein Defekt, sondern der Sinn der Sache.
          </p>
        </div>
      </section>

      {/* ================= Branches ================= */}
      <section className="abschnitt" style={{ background: '#eef4f3' }} id="code">
        <div className="wrap">
          <div className="abschnitt-kopf">
            <span className="eyebrow">Der Code</span>
            <h2>Vier Branches, vier Fassungen</h2>
            <p>
              Der Code liegt bewusst nicht alles auf einem Haufen. Jede Fassung
              hat ihren eigenen Branch — je nachdem, was man gerade braucht.
            </p>
          </div>

          <div className="karten">
            {BRANCHES.map((b) => (
              <a
                key={b.name}
                className="karte"
                href={`https://github.com/BastiLd/S-N/tree/${b.name}`}
                style={{ textDecoration: 'none' }}
              >
                <span className="karte-marke" aria-hidden="true"><IconZweig /></span>
                <h3>{b.titel}</h3>
                <p>{b.text}</p>
                <div className="karte-fuss"><code>{b.fuss}</code></div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ================= Brücke zur Gedenkseite ================= */}
      <section className="bruecke">
        <Sterne anzahl={90} saat={771} klasse="bruecke-sterne" />
        {bruecke && (
          <div
            className="bruecke-foto"
            aria-hidden="true"
            style={{ backgroundImage: `url(${pfad(bruecke.vorschau)})` }}
          />
        )}
        <div className="wrap bruecke-inhalt">
          <PfotenPaar breite={84} />
          <h2 style={{ marginTop: 24 }}>Für Simba und Nala</h2>
          <p>
            Ohne die beiden gäbe es nichts davon — nicht die Idee, nicht den
            Namen, nicht den Grund. Eine eigene Seite, nur für sie.
          </p>
          <Link className="btn btn-gold" href="/gedenken">
            Zur Gedenkseite
            <Rechts />
          </Link>
        </div>
      </section>
    </>
  );
}

/* ---------- kleine Symbole ---------- */
function Rechts() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor"
         strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10 H15 M10.5 5.5 L15 10 L10.5 14.5" />
    </svg>
  );
}
function IconHaus() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5 L12 3 L21 10.5 V20 a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}
function IconGlobus() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18" />
    </svg>
  );
}
function IconWeb() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="15" rx="2" />
      <path d="M3 9h18M7 14h6" />
    </svg>
  );
}
function IconZweig() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="5" r="2.4" />
      <circle cx="6" cy="19" r="2.4" />
      <circle cx="18" cy="9" r="2.4" />
      <path d="M6 7.4v9.2M6 12h6a6 6 0 0 0 6-2.6" />
    </svg>
  );
}
