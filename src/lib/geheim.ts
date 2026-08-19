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

   Der aufgeschlossene Zustand liegt in einem kleinen Speicher ausserhalb
   von React und wird ueber useSyncExternalStore gelesen. Zwei Gruende:
   auf der Seite gibt es mehrere Stellen mit Schloss (Karte und
   Betrachter), und die sollen gemeinsam aufgehen — mit je eigenem
   useState waere die eine offen und die andere weiter zu. Ausserdem
   liefert der Server-Schnappschuss sauber `null`, sodass beim Hydrieren
   nichts auseinanderlaeuft.
   ============================================================ */

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
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

/* ---------- Speicher ausserhalb von React ---------- */
let zwischenspeicher: Geheimnis | null | undefined;
const hoerer = new Set<() => void>();

function lesen(): Geheimnis | null {
  if (zwischenspeicher !== undefined) return zwischenspeicher;
  try {
    const g = sessionStorage.getItem(SPEICHER);
    zwischenspeicher = g ? (JSON.parse(g) as Geheimnis) : null;
  } catch {
    zwischenspeicher = null;   /* privater Modus o. Ä. */
  }
  return zwischenspeicher;
}

/* Auf dem Server gibt es keinen sessionStorage — und der Wert muss
   stabil sein, sonst rendert React endlos. */
const serverWert = () => null;

function setzen(wert: Geheimnis | null) {
  zwischenspeicher = wert;
  try {
    if (wert) sessionStorage.setItem(SPEICHER, JSON.stringify(wert));
    else sessionStorage.removeItem(SPEICHER);
  } catch { /* egal */ }
  for (const f of hoerer) f();
}

function abonnieren(f: () => void) {
  hoerer.add(f);
  return () => { hoerer.delete(f); };
}

/* ---------- Entschluesseln ---------- */
const vonB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

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
  return JSON.parse(new TextDecoder().decode(klar)) as Geheimnis;
}

/* ---------- Hook ---------- */
export function useGeheimnis() {
  const daten = useSyncExternalStore(abonnieren, lesen, serverWert);
  const [vorhanden, setVorhanden] = useState<boolean | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  /* Gibt es ueberhaupt etwas zum Aufschliessen? Die Antwort kommt aus
     einem Callback, nicht aus dem Rumpf des Effekts. */
  useEffect(() => {
    let lebt = true;
    fetch(pfad('/medien/geheim.json'), { method: 'HEAD' })
      .then((a) => { if (lebt) setVorhanden(a.ok); })
      .catch(() => { if (lebt) setVorhanden(false); });
    return () => { lebt = false; };
  }, []);

  const aufschliessen = useCallback(async (passwort: string) => {
    setLaeuft(true);
    setFehler(null);
    try {
      const antwort = await fetch(pfad('/medien/geheim.json'));
      if (!antwort.ok) throw new Error('nicht gefunden');
      const tresor: Tresor = await antwort.json();
      setzen(await entschluesseln(tresor, passwort));
      return true;
    } catch {
      setFehler('Passwort stimmt nicht.');
      return false;
    } finally {
      setLaeuft(false);
    }
  }, []);

  const abschliessen = useCallback(() => setzen(null), []);

  return { daten, offen: daten !== null, vorhanden, laeuft, fehler, aufschliessen, abschliessen };
}
