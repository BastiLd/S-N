/* ============================================================
   Kuratierung — welches Bild wo steht und was darunter steht.

   © Bastian Klaus

   Der Schluessel ist der Dateiname ohne Endung, klein geschrieben
   (also `img_3913` fuer `img_3913.webp`). Wer eine Datei hier nicht
   eintraegt, landet automatisch unten in „Alles andere" — es geht
   also nichts verloren, wenn neue Bilder dazukommen.

   `text`   steht als Bildunterschrift darunter
   `gruppe` bestimmt den Abschnitt (siehe GRUPPEN weiter unten)
   `gross`  gibt dem Bild im Raster die doppelte Breite

   Simba ist der rote Tiger, Nala die Weisse mit den roten Flecken.
   ============================================================ */

export type Gruppe = 'zusammen' | 'nala' | 'garten' | 'weite';

export type Eintrag = {
  text?: string;
  gruppe?: Gruppe;
  gross?: boolean;
};

export const KURATION: Record<string, Eintrag> = {
  /* --- die beiden zusammen, 2017 --- */
  img_20170608_140220: { gruppe: 'zusammen', gross: true,  text: 'Nala hat den Arm um Simba gelegt.' },
  img_20170608_140304: { gruppe: 'zusammen',               text: 'Kurz aufgewacht, gleich weitergeschlafen.' },
  img_20170531_182425: { gruppe: 'zusammen',               text: 'Draußen im Hof.' },
  img_20170605_174423: { gruppe: 'zusammen',               text: 'Im Garten unterwegs.' },
  img_20170605_174528: { gruppe: 'zusammen',               text: 'Noch einmal draußen.' },
  img_20170605_175051: { gruppe: 'zusammen', gross: true,  text: 'Die beiden im Gras.' },

  /* --- Nala, spaeter --- */
  img_3902: { gruppe: 'nala',              text: 'Nala im Korb unterm Dach.' },
  img_3911: { gruppe: 'nala',              text: 'Am Hals kraulen war immer erlaubt.' },
  img_3913: { gruppe: 'nala', gross: true, text: 'Im Arm eingeschlafen.' },
  img_3893: { gruppe: 'nala',              text: 'Kurzer Moment.' },
  img_3917: { gruppe: 'nala',              text: 'Die lange Aufnahme.' },

  /* --- der Platz im Garten --- */
  img_3927: { gruppe: 'garten', gross: true, text: 'Der Platz im Garten.' },
  img_3929: { gruppe: 'garten',              text: 'Mit dem Bäumchen dahinter.' },
  img_3931: { gruppe: 'garten',              text: 'Im Frühjahr, alles aufgeblüht.' },
  img_3932: { gruppe: 'garten',              text: 'Nalas Stein, dazu Basilikum und Rosen.' },

  /* --- Weite: Wege, Abende, Himmel --- */
  img_4101: { gruppe: 'weite',              text: 'Gras und Wolken.' },
  img_4408: { gruppe: 'weite',              text: 'Abendsonne durch die Speichen.' },
  img_4414: { gruppe: 'weite',              text: 'Gegenlicht.' },
  img_4420: { gruppe: 'weite', gross: true, text: 'Der Weg am Wasser, kurz vor Sonnenuntergang.' },
  img_4421: { gruppe: 'weite',              text: 'Abends unterwegs.' },
};

/* Reihenfolge und Ueberschriften der Abschnitte auf der Gedenkseite. */
export const GRUPPEN: { key: Gruppe; titel: string; text: string }[] = [
  {
    key: 'zusammen',
    titel: 'Die beiden',
    text: 'Selten allein anzutreffen',
  },
  {
    key: 'nala',
    titel: 'Nala',
    text: 'Die Weiße mit den roten Flecken',
  },
  {
    key: 'garten',
    titel: 'Der Platz im Garten',
    text: 'Steine, Muscheln, ein Bäumchen',
  },
  {
    key: 'weite',
    titel: 'Weite',
    text: 'Abende und Wege, die dazugehören',
  },
];
