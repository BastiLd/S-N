/* Liest public/medien/ aus und schreibt src/data/medien.json.
   Laeuft automatisch vor `npm run dev` und `npm run build` —
   Dateien reinlegen genuegt, sonst ist nichts zu tun.

       bilder/    fertige Bilder fuers Web (.webp/.jpg/.png/…)
       videos/    fertige Videos fuers Web (.mp4/.webm)
       vorschau/bilder/, vorschau/videos/
                  Vorschaubild je Datei, gleicher Name, .webp

   Rohmaterial vom Handy gehoert NICHT hier hinein, sondern durch
   `npm run aufbereiten` — .MOV und HEVC spielt kein Browser ab, und
   16-MB-Fotos will niemand laden.

   Bildunterschriften und Gruppen stehen in src/data/kuration.ts. Wer nur
   schnell etwas aendern will, kann auch eine `bildtexte.json` in den
   jeweiligen Ordner legen: { "datei.webp": "Text" }. */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');
const BILD = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);
const VIDEO = new Set(['.mp4', '.webm', '.ogv']);
/* Formate, die zwar herumliegen duerfen, aber im Browser nicht laufen. */
const UNBRAUCHBAR = new Set(['.mov', '.avi', '.mkv', '.3gp', '.heic', '.tif', '.tiff']);

const huebsch = (datei) =>
  basename(datei, extname(datei))
    .replace(/[-_]+/g, ' ')
    .replace(/^\d+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();

/* Vorschaubilder liegen unter vorschau/<art>/ und heissen wie die Datei,
   nur mit .webp. Nach Art getrennt, weil dieselbe Aufnahme als Foto und
   als Video vorliegen kann (IMG_3902.JPG und IMG_3902.MOV) — in einem
   gemeinsamen Ordner ueberschriebe die eine Vorschau die andere.
   Fehlt eine Vorschau, wird die Datei selbst angezeigt. */
function vorschauKarte(art) {
  const pfad = join(wurzel, 'public', 'medien', 'vorschau', art);
  if (!existsSync(pfad)) return new Map();
  return new Map(
    readdirSync(pfad)
      .filter((d) => BILD.has(extname(d).toLowerCase()))
      .map((d) => [basename(d, extname(d)).toLowerCase(), `/medien/vorschau/${art}/${d}`]),
  );
}

function lies(ordner, erlaubt, art, vorschauen, masse) {
  const pfad = join(wurzel, 'public', 'medien', ordner);
  if (!existsSync(pfad)) return [];

  let texte = {};
  const textDatei = join(pfad, 'bildtexte.json');
  if (existsSync(textDatei)) {
    try { texte = JSON.parse(readFileSync(textDatei, 'utf8')); }
    catch { console.warn(`[medien] ${ordner}/bildtexte.json ist kein gueltiges JSON — wird ignoriert.`); }
  }

  const alle = readdirSync(pfad);

  for (const d of alle) {
    if (UNBRAUCHBAR.has(extname(d).toLowerCase())) {
      console.warn(`[medien] ${ordner}/${d} laeuft im Browser nicht — bitte durch \`npm run aufbereiten\` schicken.`);
    }
  }

  return alle
    .filter((d) => erlaubt.has(extname(d).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'de', { numeric: true }))
    .map((datei) => {
      const id = basename(datei, extname(datei)).toLowerCase();
      return {
        art,
        datei,
        id,
        pfad: `/medien/${ordner}/${datei}`,
        vorschau: vorschauen.get(id) ?? `/medien/${ordner}/${datei}`,
        breite: masse[`${ordner}/${id}`]?.b ?? null,
        hoehe: masse[`${ordner}/${id}`]?.h ?? null,
        text: texte[datei] ?? huebsch(datei),
      };
    });
}

/* Seitenverhaeltnisse aus public/medien/masse.json, geschrieben von
   `npm run aufbereiten`. Fehlt ein Eintrag, nimmt die Seite 4:3 an. */
function masseKarte() {
  const p = join(wurzel, 'public', 'medien', 'masse.json');
  if (!existsSync(p)) return {};
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return {}; }
}

const masse = masseKarte();
const daten = {
  erzeugt: new Date().toISOString(),
  bilder: lies('bilder', BILD, 'bild', vorschauKarte('bilder'), masse),
  videos: lies('videos', VIDEO, 'video', vorschauKarte('videos'), masse),
};

mkdirSync(join(wurzel, 'src', 'data'), { recursive: true });
writeFileSync(join(wurzel, 'src', 'data', 'medien.json'), JSON.stringify(daten, null, 2) + '\n');
console.log(`[medien] ${daten.bilder.length} Bild(er), ${daten.videos.length} Video(s) gefunden.`);
