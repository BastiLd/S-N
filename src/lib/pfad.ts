/* Auf GitHub Pages liegt die Seite unter /S-N/, lokal unter /.
   next/link und next/image haengen den basePath selbst an, ein rohes
   <img src="/medien/..."> aber nicht — dafuer ist diese Funktion da. */
export const BASIS = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function pfad(datei: string): string {
  return `${BASIS}${datei.startsWith('/') ? '' : '/'}${datei}`;
}

/* Kleiner, deterministischer Zufall (mulberry32).
   Wichtig: Server- und Client-Render muessen dieselben Werte liefern,
   sonst meckert React beim Hydrieren. Math.random() faellt damit aus. */
export function zufall(saat: number): () => number {
  let a = saat >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
