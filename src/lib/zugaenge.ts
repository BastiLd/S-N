/* ------------------------------------------------------------------
   Wohin die Startseite verlinkt.

   Die Tailscale-Adresse steht bewusst hier oben und nur hier: sie ist
   das Einzige, was sich nach dem ersten Einrichten noch aendert.
   Adresse am Server ablesen mit:

       tailscale ip -4

   Dann unten eintragen (mit http:// und Port) und pushen — GitHub
   Actions baut die Seite neu.
   ------------------------------------------------------------------ */

export const TAILSCALE_ADRESSE = ''; // z. B. 'http://100.101.102.103:3000'

export const HEIM_ADRESSE = 'http://192.168.68.10:3000';

export const VETNOW_WEB = 'https://bastild.github.io/vetnow/';
