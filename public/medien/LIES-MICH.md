# Bilder und Videos hier reinlegen

```
public/medien/
├── bilder/   ← Fotos:  .jpg .jpeg .png .webp .avif .gif
└── videos/   ← Videos: .mp4 .webm .mov .m4v
```

Einfach die Dateien in den passenden Ordner kopieren — mehr ist nicht nötig.
Beim nächsten `npm run dev` oder `npm run build` (und bei jedem Push, weil
GitHub Actions genau das ausführt) werden sie automatisch eingelesen und
auf der Gedenkseite angezeigt.

## Reihenfolge

Sortiert wird nach Dateiname, natürlich-numerisch. Wer die Reihenfolge
bestimmen will, stellt Zahlen voran:

```
01-simba-erster-tag.jpg
02-nala-im-garten.jpg
10-beide-am-fenster.jpg
```

Die führende Zahl wird in der Anzeige wieder abgeschnitten.

## Eigene Bildunterschriften

Optional eine Datei `bildtexte.json` in `bilder/` bzw. `videos/` anlegen:

```json
{
  "01-simba-erster-tag.jpg": "Simbas erster Tag bei uns.",
  "02-nala-im-garten.jpg": "Nala hat den Garten sofort für sich beansprucht."
}
```

Ohne Eintrag wird der Dateiname als Text benutzt (Bindestriche werden zu
Leerzeichen).

## Größe

GitHub mag keine riesigen Dateien. Faustregel:

- Fotos: unter 2 MB pro Bild — lange Kante ca. 2000 px reicht völlig
- Videos: unter 50 MB, am besten `.mp4` (H.264) oder `.webm`

Alles über 100 MB weist GitHub direkt ab.
