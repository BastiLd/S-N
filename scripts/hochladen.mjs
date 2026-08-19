/* ============================================================
   Ein Befehl, alles erledigt.

   © Bastian Klaus

       npm run hochladen

   oder einfach "Hochladen.bat" doppelklicken.

   Ablauf:
     1. roh/ aufbereiten  (Fotos -> webp, Videos -> mp4, Vorschauen)
     2. Medienliste neu schreiben
     3. Probebau, damit nichts Kaputtes gepusht wird
     4. committen und pushen
     5. GitHub Actions baut und veroeffentlicht

   Bricht bei jedem Fehler ab, bevor etwas gepusht wird.
   ============================================================ */

import { execFileSync, execSync } from 'node:child_process';
import { readdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROH = join(wurzel, 'roh');
const BRANCH = 'pages';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function schritt(nr, text) {
  console.log(`\n\x1b[36m[${nr}/5]\x1b[0m ${text}`);
}
function lauf(befehl, args, optionen = {}) {
  execFileSync(befehl, args, { cwd: wurzel, stdio: 'inherit', ...optionen });
}
function still(befehl) {
  return execSync(befehl, { cwd: wurzel, encoding: 'utf8' }).trim();
}

/* --- Vorpruefungen ---------------------------------------------- */
const zweig = still('git rev-parse --abbrev-ref HEAD');
if (zweig !== BRANCH) {
  console.error(`\nFalscher Branch: "${zweig}". Die Seite liegt auf "${BRANCH}".`);
  console.error(`Umschalten mit:  git checkout ${BRANCH}`);
  process.exit(1);
}

/* Wie viel liegt ueberhaupt in roh/? */
function zaehlen(ordner) {
  if (!existsSync(ordner)) return 0;
  return readdirSync(ordner, { withFileTypes: true })
    .filter((e) => e.isFile() && extname(e.name) && !e.name.startsWith('.') && e.name !== 'LIES-MICH.txt')
    .length;
}
const neu = zaehlen(join(ROH, 'bilder')) + zaehlen(join(ROH, 'videos')) + zaehlen(ROH);
console.log(`\n\x1b[1mS-N — Hochladen\x1b[0m`);
console.log(`${neu} neue Datei(en) in roh/ gefunden.`);

/* --- 1. Aufbereiten ---------------------------------------------- */
schritt(1, 'Fotos und Videos fuers Web umrechnen …');
if (neu > 0) {
  lauf(npm, ['run', 'aufbereiten']);
} else {
  console.log('   roh/ ist leer — nichts umzurechnen. (Masse werden trotzdem geprueft.)');
  lauf(npm, ['run', 'aufbereiten']);
}

/* --- 2. Medienliste ---------------------------------------------- */
schritt(2, 'Medienliste schreiben …');
lauf(npm, ['run', 'medien']);

/* --- 3. Probebau -------------------------------------------------- */
schritt(3, 'Probebau — damit nichts Kaputtes gepusht wird …');
lauf(npm, ['run', 'build'], { env: { ...process.env, NEXT_PUBLIC_BASE_PATH: '/S-N' } });
/* Das Ergebnis brauchen wir lokal nicht; GitHub baut selbst neu. */
rmSync(join(wurzel, 'out'), { recursive: true, force: true });

/* --- 4. Committen und pushen -------------------------------------- */
schritt(4, 'Aenderungen sichern und hochladen …');
lauf('git', ['add', '-A']);

const offen = still('git status --porcelain');
if (!offen) {
  console.log('\n\x1b[33mNichts zu tun\x1b[0m — es hat sich seit dem letzten Mal nichts geaendert.');
  process.exit(0);
}

const anzahl = offen.split('\n').length;
const stempel = new Date().toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short' });
lauf('git', ['commit', '-m', `Medien aktualisiert (${stempel}) — ${anzahl} Datei(en)`]);
lauf('git', ['push', 'origin', BRANCH]);

/* --- 5. Fertig ---------------------------------------------------- */
schritt(5, 'Fertig.');
console.log(`
GitHub baut die Seite jetzt neu — das dauert ungefaehr eine Minute.

  Fortschritt:  https://github.com/BastiLd/S-N/actions
  Seite:        https://bastild.github.io/S-N/gedenken/

Die Originale in roh/ bleiben auf diesem Rechner und werden nicht
mit hochgeladen.
`);
