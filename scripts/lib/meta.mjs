/* ============================================================
   Metadaten aus Originaldateien lesen.  © Bastian Klaus

   Wird von aufbereiten.mjs (beim Umrechnen) und von exif.mjs
   (zum Nachtragen) benutzt.

   Wichtig: gelesen wird immer aus dem ORIGINAL. Die ausgelieferten
   Dateien sind bewusst EXIF-frei — sonst staende der GPS-Standort in
   einem oeffentlichen Repository. Was auf die Seite darf, entscheidet
   src/lib/einstellungen.ts, nicht die Kameradatei.
   ============================================================ */

import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { basename, extname } from 'node:path';
import exifr from 'exifr';

/* Dateinamen entschaerfen: Leerzeichen und Umlaute machen in URLs Aerger. */
export function sauber(name) {
  return basename(name, extname(name))
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/* Apple schreibt die Position als ISO 6709 in die QuickTime-Tags:
   "+46.5578+013.7063+571.861/"  ->  Breite, Laenge, Hoehe */
export function iso6709(text) {
  if (!text) return null;
  const t = String(text).match(/([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)(?:([+-]\d+(?:\.\d+)?))?/);
  if (!t) return null;
  const lat = Number.parseFloat(t[1]);
  const lon = Number.parseFloat(t[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon, hoehe: t[3] ? Math.round(Number.parseFloat(t[3])) : null };
}

const zahl = (v, stellen = 1) =>
  typeof v === 'number' && Number.isFinite(v) ? Number(v.toFixed(stellen)) : null;

/* Belichtungszeit als Bruch, so wie es auf der Kamera steht: 1/125 */
function belichtung(sekunden) {
  if (typeof sekunden !== 'number' || !Number.isFinite(sekunden) || sekunden <= 0) return null;
  if (sekunden >= 1) return `${zahl(sekunden, 1)} s`;
  return `1/${Math.round(1 / sekunden)} s`;
}

export async function bildMeta(datei) {
  let e = {};
  try {
    e = (await exifr.parse(datei, { tiff: true, exif: true, gps: true, ifd0: true })) ?? {};
  } catch { /* ohne EXIF ist auch in Ordnung */ }

  const ort = Number.isFinite(e.latitude) && Number.isFinite(e.longitude)
    ? { lat: e.latitude, lon: e.longitude, hoehe: e.GPSAltitude ? Math.round(e.GPSAltitude) : null }
    : null;

  return {
    art: 'bild',
    aufgenommen: (e.DateTimeOriginal ?? e.CreateDate ?? e.ModifyDate)?.toISOString?.() ?? null,
    kamera: [e.Make, e.Model].filter(Boolean).join(' ') || null,
    objektiv: e.LensModel ?? null,
    blende: zahl(e.FNumber, 1),
    belichtung: belichtung(e.ExposureTime),
    iso: e.ISO ?? null,
    brennweite: zahl(e.FocalLength, 1),
    brennweiteKB: zahl(e.FocalLengthIn35mmFormat, 0),
    breite: e.ExifImageWidth ?? e.ImageWidth ?? null,
    hoehe: e.ExifImageHeight ?? e.ImageHeight ?? null,
    ort,
    bytes: statSync(datei).size,
  };
}

export function videoMeta(datei) {
  let d;
  try {
    d = JSON.parse(execFileSync('ffprobe', [
      '-v', 'error', '-print_format', 'json',
      '-show_format', '-show_streams', datei,
    ]).toString());
  } catch {
    return { art: 'video', bytes: statSync(datei).size };
  }

  const tags = d.format?.tags ?? {};
  const v = (d.streams ?? []).find((s) => s.codec_type === 'video') ?? {};
  const a = (d.streams ?? []).find((s) => s.codec_type === 'audio');

  /* r_frame_rate kommt als Bruch: "60000/1001" */
  const bilderProSekunde = (() => {
    const [z, n] = String(v.r_frame_rate ?? '').split('/').map(Number);
    return z && n ? Number((z / n).toFixed(2)) : null;
  })();

  return {
    art: 'video',
    aufgenommen: tags['com.apple.quicktime.creationdate'] ?? tags.creation_time ?? null,
    kamera: [tags['com.apple.quicktime.make'], tags['com.apple.quicktime.model']]
      .filter(Boolean).join(' ') || null,
    software: tags['com.apple.quicktime.software'] ?? null,
    codec: v.codec_name ?? null,
    breite: v.width ?? null,
    hoehe: v.height ?? null,
    bilderProSekunde,
    dauer: zahl(Number.parseFloat(d.format?.duration), 1),
    bitrate: d.format?.bit_rate ? Math.round(Number(d.format.bit_rate) / 1000) : null,
    ton: a ? (a.codec_name ?? 'ja') : null,
    ort: iso6709(tags['com.apple.quicktime.location.ISO6709']),
    bytes: statSync(datei).size,
  };
}

export async function meta(datei, art) {
  return art === 'video' ? videoMeta(datei) : bildMeta(datei);
}

/* ------------------------------------------------------------------
   Ortsname zu Koordinaten — einmal beim Bauen, nicht im Browser.

   Nominatim ist der kostenlose Dienst von OpenStreetMap. Die
   Nutzungsregeln verlangen hoechstens eine Anfrage pro Sekunde und
   einen aussagekraeftigen User-Agent. Beides haelt diese Funktion ein,
   und Ergebnisse werden zwischengespeichert — bei einem zweiten Lauf
   wird gar nicht mehr gefragt.
   ------------------------------------------------------------------ */
const WARTEN = 1100;
let zuletzt = 0;

export async function ortsname(lat, lon) {
  const wartezeit = WARTEN - (Date.now() - zuletzt);
  if (wartezeit > 0) await new Promise((r) => setTimeout(r, wartezeit));
  zuletzt = Date.now();

  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('zoom', '14');       // Ortsteil-Ebene, nicht Hausnummer
  url.searchParams.set('accept-language', 'de');

  try {
    const antwort = await fetch(url, {
      headers: { 'User-Agent': 'S-N-Gedenkseite/1.0 (github.com/BastiLd/S-N)' },
    });
    if (!antwort.ok) return null;
    const d = await antwort.json();
    const a = d.address ?? {};
    const ort = a.village ?? a.town ?? a.city ?? a.municipality ?? a.hamlet ?? a.suburb ?? null;
    const region = a.state ?? a.county ?? null;
    return [ort, region].filter(Boolean).join(', ') || d.name || null;
  } catch {
    return null;   /* offline? dann eben ohne Ortsnamen */
  }
}
