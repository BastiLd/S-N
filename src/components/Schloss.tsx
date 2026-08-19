'use client';

/* Passwortfeld fuer die verschluesselten Metadaten.  © Bastian Klaus

   Es gibt hier bewusst kein "richtig/falsch" aus einem Vergleich: das
   Passwort leitet den Schluessel ab, und AES-GCM merkt beim
   Entschluesseln selbst, ob er passt. Erraten laesst sich dadurch
   nichts. */

import { useState } from 'react';

export function Schloss({
  titel, text, laeuft, fehler, onAufschliessen,
}: {
  titel: string;
  text: string;
  laeuft: boolean;
  fehler: string | null;
  onAufschliessen: (passwort: string) => void;
}) {
  const [wert, setWert] = useState('');
  return (
    <form
      className="schloss"
      onSubmit={(e) => { e.preventDefault(); if (wert) onAufschliessen(wert); }}
    >
      <span className="schloss-ic" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
          <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
          <circle cx="12" cy="15.6" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <h4>{titel}</h4>
      <p>{text}</p>
      <div className="schloss-zeile">
        <input
          type="password"
          value={wert}
          onChange={(e) => setWert(e.target.value)}
          placeholder="Passwort"
          autoComplete="off"
          aria-label="Passwort"
          disabled={laeuft}
        />
        <button type="submit" disabled={laeuft || !wert}>
          {laeuft ? 'Prüfe …' : 'Aufschließen'}
        </button>
      </div>
      {fehler && <p className="schloss-fehler" role="alert">{fehler}</p>}
    </form>
  );
}
