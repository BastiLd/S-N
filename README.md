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

**Der kurze Weg:** neue Dateien hier ablegen …

```
roh/bilder/    neue Fotos   (JPG, PNG, HEIC — Format egal)
roh/videos/    neue Videos  (MOV, MP4, AVI — Format egal)
```

… und **`Hochladen.bat`** doppelklicken. Das war's. Das Skript rechnet
um, prüft mit einem Probebau, committet, pusht, und GitHub baut die Seite
neu. Bricht bei jedem Fehler ab, *bevor* etwas hochgeladen wird.

Der Ordner `roh/` wird nicht mit eingecheckt — die Originale bleiben auf
dem Rechner.

Wer lieber selbst Hand anlegt:

```bash
npm run aufbereiten     # nur umrechnen
npm run hochladen       # umrechnen + prüfen + pushen
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

`Hochladen.bat` erledigt dabei sieben Schritte: umrechnen, Aufnahmedaten
aus den Originalen lesen, verschlüsseln, Medienliste schreiben,
Probebau, committen, pushen.

Wo ein Bild landet und was darunter steht, regelt
[`src/data/kuration.ts`](src/data/kuration.ts). Nicht eingetragene
Dateien landen automatisch unter „Alles andere". Details in
[`public/medien/LIES-MICH.md`](public/medien/LIES-MICH.md).

---

## Aus Immich holen

Wenn die Bilder in Immich liegen, statt sie von Hand zu kopieren:

```bash
npm run immich -- "https://dein-immich/share/DERSCHLUESSEL"
npm run immich -- "https://dein-immich/share/KEY" --passwort "geheim"
```

Lädt alle Originale aus der Freigabe nach `roh/bilder` bzw. `roh/videos`
— danach wie immer `Hochladen.bat`. In Immich wird nur gelesen, nichts
geändert.

Der Link muss von diesem Rechner aus erreichbar sein: läuft Immich im
Heimnetz, geht das nur von zu Hause oder über Tailscale.

---

## Aufnahmedaten und Karte — mit Passwort

Kamera, Zeitpunkt und Aufnahmeort stehen im Betrachter hinter dem
**i**-Knopf, und auf der Gedenkseite gibt es eine Karte mit den Orten.
Beides ist **verschlüsselt**.

Das ist kein „if (passwort === …)" in JavaScript — das wäre wirkungslos,
weil der Wert im Quelltext stünde. Stattdessen:

| | |
|---|---|
| Schlüssel | PBKDF2-HMAC-SHA256, 310 000 Runden, zufälliges Salz |
| Inhalt | AES-256-GCM mit Authentifizierungs-Tag |
| Entschlüsselt wird | im Browser, über die eingebaute WebCrypto-Schnittstelle |

In `public/medien/geheim.json` steht deshalb nur Rauschen. Ohne das
Passwort ist daraus nichts zu holen — auch nicht mit den
Entwicklerwerkzeugen und auch nicht mit dem heruntergeladenen
Repository. Das passt zu GitHub Pages, weil dort ohnehin nur statische
Dateien ausgeliefert werden; ein serverseitiges Passwort wäre gar nicht
möglich.

Der Klartext liegt in `daten/meta.json` und ist doppelt geschützt:
in `.gitignore`, und **außerhalb von `public/`** — denn alles unter
`public/` wird beim Bauen mit ausgeliefert.

Das Passwort selbst steht in `.passwort` im Projektordner (ebenfalls in
`.gitignore`) oder in der Umgebungsvariable `SN_PASSWORT`. GitHub
Actions braucht es nie — dort wird nur die fertige, verschlüsselte Datei
ausgeliefert.

Nach dem Ändern des Passworts:

```bash
npm run verschluesseln
```

### Wie genau die Karte zeigt

`ORTSGENAUIGKEIT` in [`src/lib/einstellungen.ts`](src/lib/einstellungen.ts):

- `'genau'` — exakt auf wenige Meter
- `'ungefaehr'` — auf ~1 km gerundet · **Standard**
- `'aus'` — keine Karte, keine Koordinaten

Standard ist `'ungefaehr'`, weil die Fotos vom Platz im Garten zu Hause
entstanden sind. Der Ortsname (z. B. „Musterdorf, Kärnten") kommt von
OpenStreetMap und ist ohnehin nur ortsgenau.

Die Karte selbst ist Leaflet mit Kacheln von OpenStreetMap — frei
nutzbar, kein Konto, kein Schlüssel. Ortsnamen werden **einmal beim
Aufbereiten** über Nominatim aufgelöst und mitgespeichert; im Browser
läuft dafür keine Abfrage.

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
scripts/aufbereiten.mjs       rechnet Rohmaterial fürs Web um
scripts/exif.mjs              liest Kamera, Zeit und Ort aus den Originalen
scripts/verschluesseln.mjs    verschlüsselt die Aufnahmedaten
scripts/hochladen.mjs         alles in einem Zug (siehe Hochladen.bat)
scripts/medien.mjs            liest public/medien/ ein
public/medien/                hier kommen Fotos und Videos rein
src/app/page.tsx              Startseite (Sturm-Hero, Zugänge, Branches)
src/app/gedenken/page.tsx     Gedenkseite (Nachthimmel, Sternbilder, Galerie)
src/app/globals.css           alles Visuelle
src/components/Himmel.tsx     Wolken, Regen, Tornado, Hügel, Sterne, Pfote
src/components/Sternbild.tsx  Pfoten-Sternbild und Kerze
src/components/Galerie.tsx    Raster der Vorschaubilder
src/components/Betrachter.tsx Großansicht: Zoom, Wischen, Aufnahmedaten
src/components/Karte.tsx      Karte der Aufnahmeorte (Leaflet + OSM)
src/components/Schloss.tsx    Passworteingabe
src/lib/geheim.ts             Entschlüsseln im Browser
src/lib/einstellungen.ts      Ortsgenauigkeit, Copyright
src/components/Rahmen.tsx     Kopf- und Fußzeile
src/lib/zugaenge.ts           die Adressen (Heimnetz, Tailscale, Web)
```

---

## Rechte

© Bastian Klaus. Alle Rechte vorbehalten.

Die Fotos und Videos auf der Gedenkseite sind private Aufnahmen und
dürfen nicht ohne Rücksprache weiterverwendet werden. Für den Code gilt
dasselbe, solange keine andere Lizenz danebensteht.
