'use client';

/* ============================================================
   Verschluesselte Metadaten im Browser aufschliessen.
   © Bastian Klaus

   Gegenstueck zu scripts/verschluesseln.mjs. Entschluesselt wird mit
   der eingebauten WebCrypto-Schnittstelle — keine Bibliothek noetig.

   Das Passwort verlaesst das Geraet nicht. Es wird nur zum Ableiten
   des Schluessels benutzt; gespeichert wird ausschliesslich das
   Ergebnis, und das nur im sessionStorage (weg beim Schliessen des
   Tabs).
   ============================================================ */

import { useCallback, useEffect, useState } from 'react';
import { pfad } from './pfad';
import type { Meta } from './medien';

export type Geheimnis = Record<string, Meta>;

type Tresor = {
  verfahren: string;
  ableitung: string;
  runden: number;
  salz: string;
  iv: string;
  inhalt: string;
};

const SPEICHER = 'sn_meta_offen';

const vonB64 = (s: string) =>
  Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function entschluesseln(tresor: Tresor, passwort: string): Promise<Geheimnis> {
  const roh = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(passwort), 'PBKDF2', false, ['deriveKey'],
  );
  const schluessel = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: vonB64(tresor.salz), iterations: tresor.runden, hash: 'SHA-256' },
    roh,
    { name: 'AES-GCM', length: 256 },
    false, ['decrypt'],
  );
  /* Schlaegt das Passwort fehl, wirft AES-GCM hier — das eingebaute
     Authentifizierungs-Tag passt dann nicht. Kein eigener Vergleich
     noetig, und es gibt nichts zu erraten. */
  const klar = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: vonB64(tresor.iv) }, schluessel, vonB64(tresor.inhalt),
  );
  return JSON.parse(new TextDecoder().decode(klar));
}

/* ------------------------------------------------------------------
   Hook: Zustand des Tresors und die Funktion zum Aufschliessen.
   ------------------------------------------------------------------ */
export function useGeheimnis() {
  const [daten, setDaten] = useState<Geheimnis | null>(null);
  const [vorhanden, setVorhanden] = useState<boolean | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  /* Innerhalb einer Sitzung nur einmal fragen. */
  useEffect(() => {
    try {
      const g = sessionStorage.getItem(SPEICHER);
      if (g) setDaten(JSON.parse(g));
    } catch { /* privater Modus o. Ä. */ }

    fetch(pfad('/medien/geheim.json'), { method: 'HEAD' })
      .then((a) => setVorhanden(a.ok))
      .catch(() => setVorhanden(false));
  }, []);

  const aufschliessen = useCallback(async (passwort: string) => {
    setLaeuft(true);
    setFehler(null);
    try {
      const antwort = await fetch(pfad('/medien/geheim.json'));
      if (!antwort.ok) throw new Error('nicht gefunden');
      const tresor: Tresor = await antwort.json();
      const g = await entschluesseln(tresor, passwort);
      setDaten(g);
      try { sessionStorage.setItem(SPEICHER, JSON.stringify(g)); } catch { /* egal */ }
      return true;
    } catch {
      setFehler('Passwort stimmt nicht.');
      return false;
    } finally {
      setLaeuft(false);
    }
  }, []);

  const abschliessen = useCallback(() => {
    setDaten(null);
    try { sessionStorage.removeItem(SPEICHER); } catch { /* egal */ }
  }, []);

  return { daten, offen: daten !== null, vorhanden, laeuft, fehler, aufschliessen, abschliessen };
}
