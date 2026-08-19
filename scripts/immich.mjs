/* ============================================================
   Bilder und Videos aus einem Immich-Freigabelink holen.
   © Bastian Klaus

       npm run immich -- "https://dein-immich/share/DERSCHLUESSEL"
       npm run immich -- "https://dein-immich/share/KEY" --passwort "geheim"

   Laedt alle Originale aus der Freigabe nach roh/bilder bzw.
   roh/videos. Danach wie immer weiter:

       Hochladen.bat        (oder: npm run hochladen)

   Es wird nur gelesen. In Immich wird nichts geaendert und nichts
   geloescht.

   Wichtig: Der Link muss von diesem Rechner aus erreichbar sein. Laeuft
   Immich im Heimnetz (192.168.x.x), geht das nur von zu Hause oder
   ueber Tailscale — nicht aus dem Internet.
   ============================================================ */

import { mkdirSync, createWriteStream, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');

const argumente = process.argv.slice(2);
const linkArg = argumente.find((a) => a.startsWith('http'));
const pwIndex = argumente.findIndex((a) => a === '--passwort' || a === '--password');
const passwort = pwIndex >= 0 ? argumente[pwIndex + 1] : null;

if (!linkArg) {
  console.error('Kein Freigabelink angegeben.');
  console.error('Aufruf: npm run immich -- "https://dein-immich/share/SCHLUESSEL"');
  process.exit(1);
}

/* Aus .../share/SCHLUESSEL werden Serveradresse und Schluessel. */
let basis, schluessel;
try {
  const u = new URL(linkArg);
  const teile = u.pathname.split('/').filter(Boolean);
  const i = teile.indexOf('share');
  if (i === -1 || !teile[i + 1]) throw new Error('kein /share/ im Pfad');
  schluessel = teile[i + 1];
  /* Alles vor /share/ ist der Serverpfad — Immich kann auch in einem
     Unterordner liegen. */
  basis = `${u.origin}${teile.slice(0, i).map((t) => `/${t}`).join('')}`;
} catch (e) {
  console.error(`Link nicht verstanden: ${e.message}`);
  console.error('Erwartet wird etwas wie https://immich.example/share/abc123');
  process.exit(1);
}

const kopf = { Accept: 'application/json' };
if (passwort) kopf['x-immich-share-key-password'] = passwort;

async function hole(pfad, extra = {}) {
  const url = new URL(`${basis}/api${pfad}`);
  url.searchParams.set('key', schluessel);
  if (passwort) url.searchParams.set('password', passwort);
  return fetch(url, { headers: kopf, ...extra });
}

console.log(`Server:     ${basis}`);
console.log(`Freigabe:   ${schluessel}`);
console.log(passwort ? 'Passwort:   gesetzt\n' : 'Passwort:   keines\n');

/* Je nach Immich-Version heisst der Endpunkt anders. */
let freigabe = null;
for (const pfad of ['/shared-links/me', '/shared-link/me']) {
  try {
    const a = await hole(pfad);
    if (a.ok) { freigabe = await a.json(); break; }
    if (a.status === 401) {
      console.error('Zugriff verweigert — ist die Freigabe passwortgeschuetzt?');
      console.error('Dann: npm run immich -- "<link>" --passwort "<das Passwort>"');
      process.exit(1);
    }
  } catch (e) {
    console.error(`Server nicht erreichbar: ${e.message}`);
    console.error('Laeuft Immich im Heimnetz? Dann geht das nur von dort (oder ueber Tailscale).');
    process.exit(1);
  }
}

if (!freigabe) {
  console.error('Die Freigabe wurde nicht gefunden. Stimmt der Link noch?');
  process.exit(1);
}

const dinge = freigabe.assets ?? freigabe.album?.assets ?? [];
if (dinge.length === 0) {
  console.error('Die Freigabe enthaelt keine Dateien.');
  process.exit(1);
}

const bilderOrdner = join(wurzel, 'roh', 'bilder');
const videoOrdner = join(wurzel, 'roh', 'videos');
mkdirSync(bilderOrdner, { recursive: true });
mkdirSync(videoOrdner, { recursive: true });

console.log(`${dinge.length} Datei(en) in der Freigabe.\n`);

let geladen = 0, uebersprungen = 0, fehlgeschlagen = 0;

for (const [i, ding] of dinge.entries()) {
  const istVideo = String(ding.type ?? '').toUpperCase() === 'VIDEO';
  const name = ding.originalFileName ?? `${ding.id}${istVideo ? '.mp4' : '.jpg'}`;
  const ziel = join(istVideo ? videoOrdner : bilderOrdner, name);
  const marke = `[${i + 1}/${dinge.length}] ${name}`;

  if (existsSync(ziel) && statSync(ziel).size > 0) {
    console.log(`${marke} — schon da, uebersprungen`);
    uebersprungen++;
    continue;
  }

  try {
    const a = await hole(`/assets/${ding.id}/original`, { headers: {} });
    if (!a.ok || !a.body) throw new Error(`HTTP ${a.status}`);
    await pipeline(Readable.fromWeb(a.body), createWriteStream(ziel));
    const mb = (statSync(ziel).size / 1024 / 1024).toFixed(1);
    console.log(`${marke} — ${mb} MB`);
    geladen++;
  } catch (e) {
    console.log(`${marke} — FEHLER: ${e.message}`);
    fehlgeschlagen++;
  }
}

console.log(`\n${geladen} geladen, ${uebersprungen} uebersprungen, ${fehlgeschlagen} fehlgeschlagen.`);
console.log('Weiter mit: Hochladen.bat  (oder npm run hochladen)');
if (extname(dinge[0]?.originalFileName ?? '').toLowerCase() === '.mov') {
  console.log('Hinweis: .MOV wird beim Aufbereiten automatisch in web-taugliches MP4 umgerechnet.');
}
