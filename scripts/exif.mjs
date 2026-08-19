/* ============================================================
   Metadaten aus Originaldateien nachtragen.  © Bastian Klaus

       npm run exif -- "C:/Pfad/zu/den/Originalen"

   Ohne Pfad wird `roh/` genommen.

   Liest Kamera, Zeitpunkt, Belichtung und Position aus den ORIGINALEN
   und schreibt sie nach public/medien/meta.json. Rechnet nichts um —
   dafuer ist `npm run aufbereiten` da. Gedacht zum Nachtragen, wenn die
   Dateien schon umgerechnet sind.

   Ortsnamen werden einmal ueber Nominatim (OpenStreetMap) aufgeloest
   und danach aus der Datei wiederverwendet.
   ============================================================ */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { meta, sauber, ortsname } from './lib/meta.mjs';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');
/* Bewusst NICHT unter public/: alles dort wird beim Bauen nach out/
   kopiert und damit ausgeliefert. Der Klartext mit den genauen
   Koordinaten bleibt hier liegen; ins Repository geht nur die
   verschluesselte Fassung. */
const ZIEL = join(wurzel, 'daten', 'meta.json');

const BILD_EIN = new Set(['.jpg', '.jpeg', '.png', '.heic', '.webp', '.avif', '.tif', '.tiff']);
const VIDEO_EIN = new Set(['.mov', '.mp4', '.m4v', '.avi', '.mkv', '.webm', '.3gp']);

const quelle = resolve(process.argv[2] ?? join(wurzel, 'roh'));
if (!existsSync(quelle)) {
  console.error(`Ordner nicht gefunden: ${quelle}`);
  process.exit(1);
}

function sammeln(ordner, treffer = []) {
  for (const e of readdirSync(ordner, { withFileTypes: true })) {
    const p = join(ordner, e.name);
    if (e.isDirectory()) sammeln(p, treffer);
    else treffer.push(p);
  }
  return treffer;
}

let alle = {};
if (existsSync(ZIEL)) {
  try { alle = JSON.parse(readFileSync(ZIEL, 'utf8')); } catch { alle = {}; }
}

const dateien = sammeln(quelle);
console.log(`Quelle: ${quelle}`);
console.log(`${dateien.length} Datei(en) gefunden.\n`);

let neu = 0;
for (const datei of dateien) {
  const endung = extname(datei).toLowerCase();
  const art = BILD_EIN.has(endung) ? 'bild' : VIDEO_EIN.has(endung) ? 'video' : null;
  if (!art) continue;

  const schluessel = `${art === 'bild' ? 'bilder' : 'videos'}/${sauber(datei)}`;
  const d = await meta(datei, art);

  /* Ortsnamen nur einmal auflösen — er haengt an den Koordinaten, und
     Nominatim will hoechstens eine Anfrage pro Sekunde. */
  if (d.ort) {
    const vorher = alle[schluessel]?.ort;
    if (vorher?.name && vorher.lat === d.ort.lat && vorher.lon === d.ort.lon) {
      d.ort.name = vorher.name;
    } else {
      process.stdout.write(`   Ort wird nachgeschlagen … `);
      d.ort.name = await ortsname(d.ort.lat, d.ort.lon);
      console.log(d.ort.name ?? 'nicht gefunden');
    }
  }

  alle[schluessel] = d;
  neu++;
  const wo = d.ort ? ` · ${d.ort.name ?? `${d.ort.lat.toFixed(4)}, ${d.ort.lon.toFixed(4)}`}` : '';
  console.log(`${basename(datei)} -> ${schluessel}${d.kamera ? ` · ${d.kamera}` : ''}${wo}`);
}

mkdirSync(dirname(ZIEL), { recursive: true });
writeFileSync(ZIEL, JSON.stringify(alle, null, 2) + '\n');
console.log(`\n${neu} Eintrag/Eintraege geschrieben, ${Object.keys(alle).length} insgesamt.`);
console.log('Jetzt `npm run medien` (passiert bei `npm run build` automatisch).');
