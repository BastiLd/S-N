# Bilder und Videos

## Der kurze Weg

Originaldateien vom Handy in den Ordner `roh/` legen (oben im Projekt,
nicht hier) und einmal ausführen:

```bash
npm run aufbereiten
```

Fertig. Das Skript legt alles Nötige in den drei Ordnern hier an. Danach
committen und pushen — GitHub Actions baut die Seite neu.

Ein anderer Quellordner geht auch:

```bash
npm run aufbereiten -- "C:/Users/basti/Music/Vid Img"
```

## Was hier liegt

```
public/medien/
├── bilder/     fertige Bilder fürs Web (.webp, max. 2400 px)
├── videos/     fertige Videos fürs Web (.mp4, H.264/AAC, max. 1080p)
├── vorschau/   Vorschaubild je Datei — bei Videos ein Standbild
└── masse.json  Seitenverhältnisse, damit das Raster nicht zuschneidet
```

Diese Ordner werden vom Skript befüllt. Von Hand hineinlegen geht auch,
solange es Web-Formate sind.

## Warum nicht einfach die Originale?

Das ist genau der Grund, warum die Videos zuerst nicht liefen:

- **`.MOV`** ist ein QuickTime-Container. Firefox spielt ihn nicht ab,
  auch wenn H.264 darin steckt.
- **HEVC (H.265)**, das iPhones ab 4K aufnehmen, kann **kein** Browser.
- Eine 1,3-GB-Datei lädt niemand über eine Webseite. GitHub nimmt Dateien
  über 100 MB ohnehin nicht an.

`npm run aufbereiten` löst alle drei Punkte auf einmal. Nebenbei werden
die EXIF-Daten entfernt — in Handyfotos steckt sonst der GPS-Standort,
und die Seite ist öffentlich.

## Reihenfolge

Sortiert wird nach Dateiname, natürlich-numerisch. Wer die Reihenfolge
bestimmen will, stellt Zahlen voran:

```
01-simba-erster-tag.jpg
02-nala-im-garten.jpg
10-beide-am-fenster.jpg
```

Die führende Zahl wird in der Anzeige wieder abgeschnitten.

## Texte und Abschnitte

Wo ein Bild auf der Gedenkseite landet und was darunter steht, regelt
[`src/data/kuration.ts`](../../src/data/kuration.ts):

```ts
img_3913: { gruppe: 'momente', text: 'Schlafen im Sitzen.' },
```

Abschnitte sind `zusammen`, `momente`, `garten` und `weite` — die
Überschriften dazu stehen in derselben Datei unter `GRUPPEN`. Was nicht
eingetragen ist, landet automatisch unter „Alles andere". Es geht also
nichts verloren, wenn neue Dateien dazukommen.

Nur schnell einen Text ändern geht auch ohne TypeScript: eine
`bildtexte.json` in `bilder/` oder `videos/` anlegen.

```json
{ "img_3913.webp": "Schlafen im Sitzen — die Spezialdisziplin." }
```

## Größe im Blick behalten

Das Skript warnt, wenn ein Video über 95 MB landet. Wird es öfter eng,
in [`scripts/aufbereiten.mjs`](../../scripts/aufbereiten.mjs) den Wert
`crf` erhöhen (26 → 28) oder `maxrate` senken.
