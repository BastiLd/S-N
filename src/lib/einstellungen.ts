/* ============================================================
   Einstellungen der Seite.  © Bastian Klaus
   ============================================================ */

/* ------------------------------------------------------------------
   Wie genau darf die Karte zeigen, wo ein Bild entstanden ist?

   Das Repository ist oeffentlich. Die Fotos vom Platz im Garten sind
   zu Hause aufgenommen — bei 'genau' steht die Hausadresse damit auf
   einer oeffentlichen Webseite.

     'genau'      exakt, auf wenige Meter
     'ungefaehr'  auf zwei Nachkommastellen gerundet (~1 km)  ← Standard
     'aus'        keine Karte, keine Koordinaten im Info-Fenster

   Der Ortsname (z. B. „Musterdorf, Kärnten") wird in allen Faellen
   ausser 'aus' angezeigt — er kommt von OpenStreetMap und ist ohnehin
   nur ortsgenau.
   ------------------------------------------------------------------ */
export type Ortsgenauigkeit = 'genau' | 'ungefaehr' | 'aus';

/* `as Ortsgenauigkeit` ist noetig: ohne das verengt TypeScript die
   Konstante auf den einen Literalwert und haelt danach jeden Vergleich
   mit den anderen beiden fuer sinnlos. */
export const ORTSGENAUIGKEIT = 'ungefaehr' as Ortsgenauigkeit;

/* Rundung passend zur Einstellung. 2 Stellen sind rund 1,1 km. */
export function runden(wert: number): number {
  if (ORTSGENAUIGKEIT === 'genau') return wert;
  return Math.round(wert * 100) / 100;
}

/* Startzoom der Karte — bei gerundeten Koordinaten waere ein enger
   Zoom irrefuehrend, weil er eine Genauigkeit vortaeuscht. */
export const KARTEN_ZOOM = ORTSGENAUIGKEIT === 'genau' ? 15 : 12;

export const RECHTE = '© Bastian Klaus';
