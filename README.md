# S-N — die GitHub-Pages-Seite

> Dieser Branch enthält **nur den Code der Website**. Der App-Code liegt
> auf anderen Branches — siehe Tabelle unten.

Live: **https://bastild.github.io/S-N/**

Zwei Seiten:

- **Start** — was das Projekt ist, wo VetNow läuft (ZimaOS im Heimnetz,
  Tailscale von unterwegs, öffentliche Fassung im Web), und welcher Branch
  was enthält.
- **Gedenken** — eine eigene Seite für Simba und Nala, mit Galerie für
  eigene Fotos und Videos.

Gebaut mit Next.js 16 und React 19 als **statischer Export** (`output: 'export'`),
veröffentlicht von GitHub Actions. Keine Laufzeit, kein Server, keine
externen Dienste — alle Animationen sind CSS und SVG.

---

## Branches in diesem Repository

| Branch | Was drin ist |
|--------|--------------|
| `main` | nur die README mit der Projektidee |
| `alles` | VetNow komplett (Web, Handy, Extension, Studio, Docker) plus beide Pfotennotruf-Fassungen |
| `vetnow-app` | VetNow ohne Studio und ohne Docker — Website, Handy-App, Extension |
| **`pages`** | **dieser Branch — der Code dieser Website** |

---

## Bilder und Videos einbauen

```
public/medien/
├── bilder/   ← .jpg .jpeg .png .webp .avif .gif
└── videos/   ← .mp4 .webm .mov .m4v
```

Dateien hineinlegen, committen, pushen. Mehr nicht. Beim Bauen liest
`scripts/medien.mjs` beide Ordner aus und schreibt `src/data/medien.json`;
die Gedenkseite zeigt anschließend alles an.

- **Reihenfolge** über führende Zahlen im Dateinamen (`01-…`, `02-…`).
  Die Zahl wird in der Anzeige wieder abgeschnitten.
- **Eigene Bildunterschriften** über eine `bildtexte.json` im jeweiligen
  Ordner: `{ "01-simba.jpg": "Text unter dem Bild" }`.
- Details stehen in [`public/medien/LIES-MICH.md`](public/medien/LIES-MICH.md).

Größen: Fotos möglichst unter 2 MB, Videos unter 50 MB. Über 100 MB nimmt
GitHub die Datei gar nicht erst an.

---

## Tailscale-Adresse eintragen

Auf der Startseite ist die Kachel „Unterwegs über Tailscale" so lange
inaktiv, bis die Adresse hinterlegt ist. Am Server ablesen:

```bash
tailscale ip -4
```

Dann in [`src/lib/zugaenge.ts`](src/lib/zugaenge.ts) eintragen:

```ts
export const TAILSCALE_ADRESSE = 'http://100.101.102.103:3000';
```

Pushen — GitHub Actions baut neu, die Kachel wird zum Link.

---

## Lokal starten

```bash
npm install
npm run dev
```

Läuft dann auf http://localhost:3000. Lokal ohne `basePath` — der wird
nur im Build gesetzt (`NEXT_PUBLIC_BASE_PATH=/S-N`), weil die Seite auf
GitHub Pages in einem Unterordner liegt.

Statisch bauen wie in der Action:

```bash
NEXT_PUBLIC_BASE_PATH=/S-N npm run build
```

Ergebnis liegt in `out/`.

---

## Veröffentlichung

`.github/workflows/pages.yml` läuft bei jedem Push auf `pages`. Damit das
greift, muss im Repository unter **Settings → Pages** als *Source*
**GitHub Actions** eingestellt sein.

> GitHub Pages ist für **private** Repositories nur in bezahlten Plänen
> verfügbar. Solange `S-N` privat und der Plan kostenlos ist, baut die
> Action zwar, veröffentlichen kann sie aber nicht — dann muss das
> Repository entweder öffentlich werden, oder die Seite zieht in ein
> eigenes öffentliches Repository um.

---

## Aufbau

```
.github/workflows/pages.yml   baut und veröffentlicht
scripts/medien.mjs            liest public/medien/ ein
public/medien/                hier kommen Fotos und Videos rein
src/app/page.tsx              Startseite (Sturm-Hero, Zugänge, Branches)
src/app/gedenken/page.tsx     Gedenkseite (Nachthimmel, Sternbilder, Galerie)
src/app/globals.css           alles Visuelle
src/components/Himmel.tsx     Wolken, Regen, Tornado, Hügel, Sterne, Pfote
src/components/Sternbild.tsx  Pfoten-Sternbild und Kerze
src/components/Galerie.tsx    Galerie mit Lightbox
src/components/Rahmen.tsx     Kopf- und Fußzeile
src/lib/zugaenge.ts           die Adressen (Heimnetz, Tailscale, Web)
```
