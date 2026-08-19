'use client';

/* ============================================================
   Karte mit den Orten der Aufnahmen.  © Bastian Klaus

   Leaflet + Kacheln von OpenStreetMap — beides frei nutzbar, kein
   Konto, kein Schluessel. Leaflet liegt im Bundle, nur die Kacheln
   kommen von osm.org; deren Nutzungsregeln sind fuer eine private
   Seite in dieser Groessenordnung unproblematisch.

   Wie genau die Punkte liegen, entscheidet ORTSGENAUIGKEIT in
   src/lib/einstellungen.ts — nicht diese Datei.
   ============================================================ */

import { useEffect, useMemo, useRef, useState } from 'react';
import type * as L from 'leaflet';
import { pfad } from '@/lib/pfad';
import { type Stueck, sichtbarerOrt, koordinaten, metaSchluessel } from '@/lib/medien';
import { ORTSGENAUIGKEIT, KARTEN_ZOOM } from '@/lib/einstellungen';
import { useGeheimnis } from '@/lib/geheim';
import { Betrachter } from './Betrachter';
import { Schloss } from './Schloss';
import 'leaflet/dist/leaflet.css';

type Punkt = { lat: number; lon: number; name: string | null; stuecke: Stueck[] };

export function Karte({ stuecke }: { stuecke: Stueck[] }) {
  const behaelter = useRef<HTMLDivElement>(null);
  const [offen, setOffen] = useState<number | null>(null);
  /* Die Orte stecken in den verschluesselten Metadaten — ohne Passwort
     gibt es hier nichts zu zeigen. */
  const tresor = useGeheimnis();

  /* Aufnahmen am selben Ort zu einem Punkt zusammenfassen — sonst
     liegen zwanzig Nadeln uebereinander und man kann keine treffen. */
  const punkte = useMemo<Punkt[]>(() => {
    const karte = new Map<string, Punkt>();
    if (!tresor.daten) return [];
    for (const s of stuecke) {
      const ort = sichtbarerOrt(tresor.daten[metaSchluessel(s)]?.ort);
      if (!ort) continue;
      const schluessel = `${ort.lat.toFixed(4)},${ort.lon.toFixed(4)}`;
      const vorhanden = karte.get(schluessel);
      if (vorhanden) vorhanden.stuecke.push(s);
      else karte.set(schluessel, { lat: ort.lat, lon: ort.lon, name: ort.name ?? null, stuecke: [s] });
    }
    return [...karte.values()].sort((a, b) => b.stuecke.length - a.stuecke.length);
  }, [stuecke, tresor.daten]);

  /* Reihenfolge fuer den Betrachter: alle verorteten Aufnahmen, nach
     Punkten gruppiert — so blaettert man durch, was zusammengehoert. */
  const reihe = useMemo(() => punkte.flatMap((p) => p.stuecke), [punkte]);

  useEffect(() => {
    if (!behaelter.current || punkte.length === 0) return;
    let karte: import('leaflet').Map | null = null;
    let abgebrochen = false;

    /* Leaflet fasst beim Laden window an — deshalb erst im Browser. */
    (async () => {
      const L = (await import('leaflet')).default;
      if (abgebrochen || !behaelter.current) return;

      karte = L.map(behaelter.current, {
        scrollWheelZoom: false,   /* sonst faengt die Karte das Seitenscrollen ab */
        attributionControl: true,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende',
      }).addTo(karte);

      const ebene = L.layerGroup().addTo(karte);

      /* Welcher Punkt beginnt an welcher Stelle in `reihe`? Damit ein
         Klick den Betrachter an der richtigen Stelle oeffnet. */
      const beginn = new Map<Punkt, number>();
      let laufend = 0;
      for (const p of punkte) { beginn.set(p, laufend); laufend += p.stuecke.length; }

      /* Punkte, die bei der aktuellen Zoomstufe uebereinander liegen
         wuerden, zu einer Nadel zusammenfassen — sonst verdeckt in
         Kaernten eine die andere und man trifft keine davon. Beim
         Hineinzoomen loest sich das von selbst wieder auf. */
      const zeichnen = () => {
        if (!karte) return;
        ebene.clearLayers();

        type Buendel = { punkt: L.Point; punkte: Punkt[] };
        const buendel: Buendel[] = [];
        for (const p of punkte) {
          const bild = karte.latLngToLayerPoint([p.lat, p.lon]);
          const treffer = buendel.find((b) => b.punkt.distanceTo(bild) < 54);
          if (treffer) treffer.punkte.push(p);
          else buendel.push({ punkt: bild, punkte: [p] });
        }

        for (const b of buendel) {
          const anzahl = b.punkte.reduce((n, p) => n + p.stuecke.length, 0);
          const erster = b.punkte[0];
          const mitte = karte.layerPointToLatLng(b.punkt);

          const nadel = L.divIcon({
            className: 'karten-nadel',
            html: `<span class="kn-bild" style="background-image:url('${pfad(erster.stuecke[0].vorschau)}')"></span>` +
                  (anzahl > 1 ? `<span class="kn-zahl">${anzahl}</span>` : ''),
            iconSize: [46, 46],
            iconAnchor: [23, 46],
            popupAnchor: [0, -44],
          });

          const namen = [...new Set(b.punkte.map((p) => p.name).filter(Boolean))];
          L.marker(mitte, { icon: nadel, title: namen.join(' · ') || undefined })
            .addTo(ebene)
            .bindPopup(
              `<strong>${namen.join(' · ') || 'Unbekannter Ort'}</strong><br>` +
              `${anzahl} Aufnahme${anzahl === 1 ? '' : 'n'}` +
              (b.punkte.length > 1 ? ` an ${b.punkte.length} Stellen` : '') + '<br>' +
              `<span class="kp-koord">${koordinaten({ lat: erster.lat, lon: erster.lon, hoehe: null })}</span>`,
            )
            .on('click', () => setOffen(beginn.get(erster) ?? 0));
        }
      };

      const grenzen = L.latLngBounds(punkte.map((p) => [p.lat, p.lon] as [number, number]));
      if (punkte.length === 1) karte.setView(grenzen.getCenter(), KARTEN_ZOOM);
      else karte.fitBounds(grenzen.pad(0.35), { maxZoom: KARTEN_ZOOM });

      zeichnen();
      karte.on('zoomend', zeichnen);
    })();

    return () => { abgebrochen = true; karte?.remove(); };
  }, [punkte]);

  if (ORTSGENAUIGKEIT === 'aus') return null;
  if (tresor.vorhanden === false) return null;

  /* Noch verschlossen: den Abschnitt trotzdem zeigen, damit klar ist,
     dass es ihn gibt. */
  if (!tresor.offen) {
    return (
      <section className="gruppe">
        <div className="galerie-kopf">
          <span className="eyebrow">Wo das alles war</span>
          <h2>Auf der Karte</h2>
        </div>
        <div className="karte-schloss">
          <Schloss
            titel="Karte der Aufnahmeorte"
            text="Die Orte sind verschlüsselt hinterlegt. Mit dem Passwort werden sie hier im Browser aufgeschlossen — sie liegen nirgends im Klartext."
            laeuft={tresor.laeuft}
            fehler={tresor.fehler}
            onAufschliessen={tresor.aufschliessen}
          />
        </div>
      </section>
    );
  }

  if (punkte.length === 0) return null;

  return (
    <section className="gruppe">
      <div className="galerie-kopf">
        <span className="eyebrow">Wo das alles war</span>
        <h2>Auf der Karte</h2>
        <p>
          {reihe.length} Aufnahmen mit Ortsangabe an {punkte.length}{' '}
          {punkte.length === 1 ? 'Stelle' : 'Stellen'}. Auf eine Nadel tippen
          öffnet die Bilder von dort; nah beieinander liegende Orte
          trennen sich beim Hineinzoomen.
          {ORTSGENAUIGKEIT === 'ungefaehr' && ' Die Punkte sind bewusst auf etwa einen Kilometer gerundet.'}
        </p>
      </div>

      <div className="karte-rahmen">
        <div className="karte" ref={behaelter} role="application" aria-label="Karte der Aufnahmeorte" />
      </div>

      {offen !== null && (
        <Betrachter
          stuecke={reihe}
          index={offen}
          setIndex={setOffen}
          onSchliessen={() => setOffen(null)}
        />
      )}
    </section>
  );
}
