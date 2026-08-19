/* ============================================================
   Metadaten verschluesseln.  © Bastian Klaus

       npm run verschluesseln

   Liest public/medien/meta.json (Klartext, bleibt lokal) und schreibt
   public/medien/geheim.json — nur diese Datei geht ins Repository.

   Verfahren
     Schluessel   PBKDF2-HMAC-SHA256, 310 000 Runden, 16 Byte Salz
     Inhalt       AES-256-GCM, 12 Byte IV, mit Authentifizierungs-Tag

   Das ist keine Attrappe: ohne Passwort steht in geheim.json nichts als
   Rauschen. Auch mit F12, auch mit dem heruntergeladenen Repository.
   Gegenstueck im Browser ist src/lib/geheim.ts.

   Das Passwort kommt aus der Datei `.passwort` im Projektordner oder
   aus der Umgebungsvariable SN_PASSWORT. Beides steht in .gitignore
   beziehungsweise wird nie geschrieben.
   ============================================================ */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto as crypto } from 'node:crypto';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');
const QUELLE = join(wurzel, 'daten', 'meta.json');
const ZIEL = join(wurzel, 'public', 'medien', 'geheim.json');
const PASSWORTDATEI = join(wurzel, '.passwort');

const RUNDEN = 310_000;

function passwortHolen() {
  if (process.env.SN_PASSWORT) return process.env.SN_PASSWORT;
  if (existsSync(PASSWORTDATEI)) {
    const p = readFileSync(PASSWORTDATEI, 'utf8').replace(/\r?\n$/, '');
    if (p.length > 0) return p;
  }
  console.error('Kein Passwort gefunden.');
  console.error('Entweder die Datei `.passwort` im Projektordner anlegen');
  console.error('oder SN_PASSWORT setzen. Beides bleibt lokal.');
  process.exit(1);
}

if (!existsSync(QUELLE)) {
  console.error(`${QUELLE} fehlt — erst \`npm run exif\` laufen lassen.`);
  process.exit(1);
}

const passwort = passwortHolen();
const klartext = readFileSync(QUELLE, 'utf8');

const salz = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));

const rohschluessel = await crypto.subtle.importKey(
  'raw', new TextEncoder().encode(passwort), 'PBKDF2', false, ['deriveKey'],
);
const schluessel = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt: salz, iterations: RUNDEN, hash: 'SHA-256' },
  rohschluessel,
  { name: 'AES-GCM', length: 256 },
  false, ['encrypt'],
);
const inhalt = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv }, schluessel, new TextEncoder().encode(klartext),
);

const b64 = (u8) => Buffer.from(u8).toString('base64');

writeFileSync(ZIEL, JSON.stringify({
  verfahren: 'AES-256-GCM',
  ableitung: 'PBKDF2-SHA256',
  runden: RUNDEN,
  salz: b64(salz),
  iv: b64(iv),
  inhalt: b64(new Uint8Array(inhalt)),
}, null, 2) + '\n');

const eintraege = Object.keys(JSON.parse(klartext)).length;
console.log(`[geheim] ${eintraege} Eintrag/Eintraege verschluesselt.`);
console.log(`[geheim] ${(klartext.length / 1024).toFixed(1)} kB Klartext -> ${(inhalt.byteLength / 1024).toFixed(1)} kB.`);
console.log('[geheim] daten/meta.json bleibt lokal, geheim.json geht ins Repository.');
