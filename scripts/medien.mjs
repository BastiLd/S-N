/* Liest public/medien/bilder und public/medien/videos aus und schreibt
   src/data/medien.json. Laeuft automatisch vor `npm run dev` und
   `npm run build` — Dateien reinlegen genuegt, sonst nichts zu tun.

   Bildunterschriften: eine Datei `bildtexte.json` im jeweiligen Ordner,
   Form { "dateiname.jpg": "Text unter dem Bild" }. Fehlt sie, wird der
   Dateiname als Titel benutzt (Bindestriche werden zu Leerzeichen). */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');
const BILD = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);
const VIDEO = new Set(['.mp4', '.webm', '.mov', '.m4v']);

const huebsch = (datei) =>
  basename(datei, extname(datei))
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\d+[\s.]*/, '')
    .trim();

function lies(ordner, erlaubt, art) {
  const pfad = join(wurzel, 'public', 'medien', ordner);
  if (!existsSync(pfad)) return [];
  let texte = {};
  const textDatei = join(pfad, 'bildtexte.json');
  if (existsSync(textDatei)) {
    try { texte = JSON.parse(readFileSync(textDatei, 'utf8')); }
    catch { console.warn(`[medien] ${ordner}/bildtexte.json ist kein gueltiges JSON — wird ignoriert.`); }
  }
  return readdirSync(pfad)
    .filter((d) => erlaubt.has(extname(d).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'de', { numeric: true }))
    .map((datei) => ({
      art,
      datei,
      pfad: `/medien/${ordner}/${datei}`,
      text: texte[datei] ?? huebsch(datei),
    }));
}

const daten = {
  erzeugt: new Date().toISOString(),
  bilder: lies('bilder', BILD, 'bild'),
  videos: lies('videos', VIDEO, 'video'),
};

mkdirSync(join(wurzel, 'src', 'data'), { recursive: true });
writeFileSync(join(wurzel, 'src', 'data', 'medien.json'), JSON.stringify(daten, null, 2) + '\n');
console.log(`[medien] ${daten.bilder.length} Bild(er), ${daten.videos.length} Video(s) gefunden.`);
