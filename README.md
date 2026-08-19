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

Originaldateien vom Handy nach `roh/` legen und einmal:

```bash
npm run aufbereiten
```

Ein anderer Quellordner geht auch:

```bash
npm run aufbereiten -- "C:/Users/basti/Music/Vid Img"
```

Das Skript rechnet alles auf web-taugliche Formate um und legt es an:

```
public/medien/
├── bilder/     .webp, max. 2400 px
├── videos/     .mp4 (H.264/AAC), max. 1080p, faststart
├── vorschau/   ein Vorschaubild je Datei — bei Videos ein Standbild
└── masse.json  Seitenverhältnisse fürs Raster
```

**Warum nicht einfach die Originale?** Genau daran sind die Videos zuerst
gescheitert: `.MOV` ist ein QuickTime-Container, den Firefox nicht
abspielt, iPhone-4K ist **HEVC** und läuft in *keinem* Browser, und
1,3 GB pro Datei nimmt GitHub ohnehin nicht an (Grenze: 100 MB). Nebenbei
werden EXIF-Daten entfernt — sonst steckt der GPS-Standort in den Fotos,
und die Seite ist öffentlich.

Wo ein Bild landet und was darunter steht, regelt
[`src/data/kuration.ts`](src/data/kuration.ts). Nicht eingetragene
Dateien landen automatisch unter „Alles andere". Details in
[`public/medien/LIES-MICH.md`](public/medien/LIES-MICH.md).

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
