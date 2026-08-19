/* ESLint fuer Next.js.  © Bastian Klaus
   Aufruf: npm run lint

   eslint-config-next 16 liefert bereits eine Flat-Config-Liste. Der
   Umweg ueber FlatCompat ist damit nicht mehr noetig — und scheitert
   dort sogar an einer zirkulaeren Struktur in den Plugin-Objekten. */
import next from 'eslint-config-next';

const konfiguration = [
  { ignores: ['.next/**', 'out/**', 'node_modules/**', 'daten/**', 'roh/**'] },
  ...next,
  {
    rules: {
      /* Die Bilder liegen als statischer Export auf GitHub Pages. next/image
         braucht dort einen Loader und bringt nichts — die Dateien sind schon
         auf Zielgroesse gerechnet. */
      '@next/next/no-img-element': 'off',
    },
  },
];

export default konfiguration;
