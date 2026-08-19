/* ============================================================
   Rohdateien fuer das Web aufbereiten.

       npm run aufbereiten -- "C:/Pfad/zu/den/Originalen"

   Ohne Pfad wird `roh/` im Projekt genommen. Unterordner werden
   mitgelesen, es zaehlt nur die Dateiendung.

   Was passiert:

   Bilder  -> public/medien/bilder/<name>.webp     (max. 2400 px)
   Videos  -> public/medien/videos/<name>.mp4      (H.264/AAC, max. 1080p)
   beides  -> public/medien/vorschau/<art>/<name>.webp (800 px Vorschau)

   Warum ueberhaupt umrechnen:
   - .MOV ist ein QuickTime-Container. Firefox spielt ihn nicht ab,
     auch wenn H.264 drinsteckt.
   - iPhone-Videos sind oft HEVC (H.265). Das kann kein Browser.
   - 1,3 GB pro Datei will niemand ueber eine Webseite laden.

   Nebenbei werden EXIF-Daten entfernt — in Handyfotos steckt sonst
   der GPS-Standort, und die Seite ist oeffentlich.
   ============================================================ */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync, rmSync } from 'node:fs';
import { join, extname, basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');
const ZIEL_BILD = join(wurzel, 'public', 'medien', 'bilder');
const ZIEL_VIDEO = join(wurzel, 'public', 'medien', 'videos');
/* Vorschauen liegen nach Typ getrennt: eine Aufnahme kann als Foto UND
   als Video vorliegen (IMG_3902.JPG und IMG_3902.MOV) — bei einem
   gemeinsamen Ordner ueberschreibt die zweite die erste. */
const ZIEL_VORSCHAU_BILD = join(wurzel, 'public', 'medien', 'vorschau', 'bilder');
const ZIEL_VORSCHAU_VIDEO = join(wurzel, 'public', 'medien', 'vorschau', 'videos');

const BILD_EIN = new Set(['.jpg', '.jpeg', '.png', '.heic', '.webp', '.avif', '.tif', '.tiff']);
const VIDEO_EIN = new Set(['.mov', '.mp4', '.m4v', '.avi', '.mkv', '.webm', '.3gp']);

const BREITE_GROSS = 2400;
const BREITE_VORSCHAU = 800;

const eigenerPfad = process.argv[2];
const quelle = resolve(eigenerPfad ?? join(wurzel, 'roh'));

if (!existsSync(quelle)) {
  if (eigenerPfad) {
    console.error(`Ordner nicht gefunden: ${quelle}`);
    console.error('Aufruf: npm run aufbereiten -- "C:/Pfad/zu/den/Originalen"');
    process.exit(1);
  }
  /* roh/ steht in .gitignore und fehlt daher nach einem frischen Clone.
     Kein Grund abzubrechen — einfach anlegen. */
  mkdirSync(join(quelle, 'bilder'), { recursive: true });
  mkdirSync(join(quelle, 'videos'), { recursive: true });
  console.log(`Ordner roh/bilder und roh/videos angelegt.`);
}
mkdirSync(join(quelle, 'bilder'), { recursive: true });
mkdirSync(join(quelle, 'videos'), { recursive: true });

for (const o of [ZIEL_BILD, ZIEL_VIDEO, ZIEL_VORSCHAU_BILD, ZIEL_VORSCHAU_VIDEO]) mkdirSync(o, { recursive: true });

/* Dateinamen entschaerfen: Leerzeichen und Umlaute machen in URLs Aerger. */
function sauber(name) {
  return basename(name, extname(name))
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function sammeln(ordner, treffer = []) {
  for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
    const p = join(ordner, eintrag.name);
    if (eintrag.isDirectory()) sammeln(p, treffer);
    else treffer.push(p);
  }
  return treffer;
}

const mb = (p) => (statSync(p).size / 1024 / 1024).toFixed(1);

function ffmpeg(args) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: ['ignore', 'ignore', 'inherit'],
  });
}

function dauer(datei) {
  try {
    const s = execFileSync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration',
      '-of', 'default=nw=1:nk=1', datei,
    ]).toString().trim();
    return Number.parseFloat(s) || 0;
  } catch { return 0; }
}

/* Seitenverhaeltnisse merken. Das Raster auf der Seite braucht sie, damit
   Hochformate nicht auf 4:3 beschnitten werden — und der Browser kann den
   Platz schon reservieren, bevor das Bild da ist (kein Springen beim Laden). */
const MASSE_DATEI = join(wurzel, 'public', 'medien', 'masse.json');
let masse = {};
if (existsSync(MASSE_DATEI)) {
  try { masse = JSON.parse(readFileSync(MASSE_DATEI, 'utf8')); } catch { masse = {}; }
}
const merken = async (id, datei) => {
  try {
    const m = await sharp(datei).metadata();
    if (m.width && m.height) masse[id] = { b: m.width, h: m.height };
  } catch { /* nicht schlimm, dann gilt der Standardwert */ }
};

const dateien = sammeln(quelle);
const bilder = dateien.filter((d) => BILD_EIN.has(extname(d).toLowerCase()));
const videos = dateien.filter((d) => VIDEO_EIN.has(extname(d).toLowerCase()));

console.log(`Quelle: ${quelle}`);
console.log(`${bilder.length} Bild(er), ${videos.length} Video(s) gefunden.\n`);

/* ---------------- Bilder ---------------- */
for (const [i, datei] of bilder.entries()) {
  const name = sauber(datei);
  const gross = join(ZIEL_BILD, `${name}.webp`);
  const klein = join(ZIEL_VORSCHAU_BILD, `${name}.webp`);
  process.stdout.write(`[Bild ${i + 1}/${bilder.length}] ${basename(datei)} (${mb(datei)} MB) … `);
  try {
    /* .rotate() ohne Argument wertet die EXIF-Ausrichtung aus — ohne das
       liegen Handyfotos auf der Seite quer. */
    const bild = sharp(datei, { failOn: 'none' }).rotate();
    await bild.clone()
      .resize({ width: BREITE_GROSS, height: BREITE_GROSS, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toFile(gross);
    await bild.clone()
      .resize({ width: BREITE_VORSCHAU, height: BREITE_VORSCHAU, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(klein);
    await merken(`bilder/${name}`, gross);
    console.log(`-> ${name}.webp (${mb(gross)} MB) + Vorschau (${mb(klein)} MB)`);
  } catch (e) {
    console.log(`FEHLER: ${e.message}`);
  }
}

/* ---------------- Videos ---------------- */
for (const [i, datei] of videos.entries()) {
  const name = sauber(datei);
  const ziel = join(ZIEL_VIDEO, `${name}.mp4`);
  const vorschau = join(ZIEL_VORSCHAU_VIDEO, `${name}.webp`);
  const laenge = dauer(datei);
  process.stdout.write(`[Video ${i + 1}/${videos.length}] ${basename(datei)} (${mb(datei)} MB, ${laenge.toFixed(0)} s) … `);

  /* Lange Aufnahmen bekommen eine Bitratenbremse, damit aus 3 Minuten
     4K nicht 300 MB im Repository werden. GitHub nimmt ueber 100 MB
     pro Datei gar nicht erst an. */
  const lang = laenge > 60;
  const crf = lang ? '26' : '23';
  const raten = lang ? ['-maxrate', '2500k', '-bufsize', '5000k'] : ['-maxrate', '5000k', '-bufsize', '10000k'];

  try {
    ffmpeg([
      '-i', datei,
      '-vf', 'scale=\'min(1920,iw)\':-2:flags=lanczos',
      '-r', '30',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, ...raten,
      '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
      '-c:a', 'aac', '-b:a', '128k', '-ac', '2',
      /* faststart schiebt den Index an den Anfang — sonst beginnt das
         Video im Browser erst, wenn die ganze Datei geladen ist. */
      '-movflags', '+faststart',
      ziel,
    ]);

    /* Standbild als Vorschau: 12 % in die Aufnahme hinein, damit man
       nicht das schwarze Bild vom Anfang erwischt. */
    const zeit = Math.max(0.1, laenge * 0.12);
    const roh = join(ZIEL_VORSCHAU_VIDEO, `${name}.__roh.png`);
    ffmpeg(['-ss', String(zeit), '-i', ziel, '-frames:v', '1', '-vf', `scale=${BREITE_VORSCHAU}:-2`, roh]);
    await sharp(roh).webp({ quality: 78, effort: 5 }).toFile(vorschau);
    await merken(`videos/${name}`, vorschau);
    rmSync(roh, { force: true });

    console.log(`-> ${name}.mp4 (${mb(ziel)} MB)`);
    if (statSync(ziel).size > 95 * 1024 * 1024) {
      console.log(`   ACHTUNG: ueber 95 MB — GitHub lehnt ab 100 MB ab.`);
    }
  } catch (e) {
    console.log(`FEHLER: ${e.message}`);
  }
}

/* Zum Schluss die Masse fuer ALLES nachtragen, was in den Zielordnern
   liegt — nicht nur fuer das, was gerade umgerechnet wurde. Dadurch
   repariert ein Lauf mit leerem roh/ auch eine fehlende masse.json,
   ohne dass etwas neu kodiert wird. */
for (const [art, ordner] of [['bilder', ZIEL_VORSCHAU_BILD], ['videos', ZIEL_VORSCHAU_VIDEO]]) {
  if (!existsSync(ordner)) continue;
  for (const d of readdirSync(ordner)) {
    if (!BILD_EIN.has(extname(d).toLowerCase())) continue;
    const schluessel = `${art}/${basename(d, extname(d)).toLowerCase()}`;
    if (masse[schluessel]) continue;
    await merken(schluessel, join(ordner, d));
  }
}

writeFileSync(MASSE_DATEI, JSON.stringify(masse, null, 2) + '\n');
console.log(`\nMasse fuer ${Object.keys(masse).length} Datei(en) notiert.`);
console.log('Fertig. Jetzt `npm run medien` (passiert bei `npm run build` automatisch).');
