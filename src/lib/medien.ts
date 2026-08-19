/* Gemeinsame Typen und kleine Helfer fuer Galerie, Betrachter und Karte.
   © Bastian Klaus */

import { ORTSGENAUIGKEIT, runden } from './einstellungen';

export type Ort = {
  lat: number;
  lon: number;
  hoehe: number | null;
  name?: string | null;
};

export type Meta = {
  art: 'bild' | 'video';
  aufgenommen: string | null;
  kamera: string | null;
  objektiv?: string | null;
  software?: string | null;
  blende?: number | null;
  belichtung?: string | null;
  iso?: number | null;
  brennweite?: number | null;
  brennweiteKB?: number | null;
  codec?: string | null;
  bilderProSekunde?: number | null;
  dauer?: number | null;
  bitrate?: number | null;
  ton?: string | null;
  breite: number | null;
  hoehe: number | null;
  ort: Ort | null;
  bytes: number;
};

export type Stueck = {
  art: 'bild' | 'video';
  datei: string;
  id: string;
  pfad: string;
  vorschau: string;
  breite: number | null;
  hoehe: number | null;
  text: string;
  gross?: boolean;
  /* Erst vorhanden, wenn die verschluesselten Daten aufgeschlossen
     sind — siehe src/lib/geheim.ts. */
  meta?: Meta | null;
};

/* Schluessel im Tresor: "bilder/img_3931" bzw. "videos/img_3917". */
export function metaSchluessel(s: Pick<Stueck, 'art' | 'id'>): string {
  return `${s.art === 'bild' ? 'bilder' : 'videos'}/${s.id}`;
}

/* ---------- Anzeige-Helfer ---------- */

export function datumLang(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('de-AT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function datumKurz(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function groesse(bytes: number | null | undefined): string | null {
  if (!bytes) return null;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function dauerText(sekunden: number | null | undefined): string | null {
  if (!sekunden) return null;
  const m = Math.floor(sekunden / 60);
  const s = Math.round(sekunden % 60);
  return m > 0 ? `${m}:${String(s).padStart(2, '0')} min` : `${s} s`;
}

export function megapixel(b: number | null | undefined, h: number | null | undefined): string | null {
  if (!b || !h) return null;
  return `${b} × ${h} (${(b * h / 1_000_000).toFixed(1)} MP)`;
}

/* Position so, wie sie oeffentlich gezeigt werden darf. */
export function sichtbarerOrt(ort: Ort | null | undefined): Ort | null {
  if (!ort || ORTSGENAUIGKEIT === 'aus') return null;
  return { ...ort, lat: runden(ort.lat), lon: runden(ort.lon) };
}

export function koordinaten(ort: Ort): string {
  const n = ORTSGENAUIGKEIT === 'genau' ? 5 : 2;
  return `${ort.lat.toFixed(n)}°, ${ort.lon.toFixed(n)}°`;
}
