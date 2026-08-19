'use client';

/* Aufnahmedaten eines Bildes oder Videos.  © Bastian Klaus */

import {
  type Meta, datumLang, groesse, dauerText, megapixel,
  sichtbarerOrt, koordinaten,
} from '@/lib/medien';
import { RECHTE } from '@/lib/einstellungen';

export function InfoTafel({ meta, onAbschliessen }: { meta: Meta | null; onAbschliessen: () => void }) {
  if (!meta) {
    return (
      <>
        <h3>Aufnahme</h3>
        <p className="bt-rechte">Zu dieser Datei sind keine Aufnahmedaten hinterlegt.</p>
      </>
    );
  }

  const ort = sichtbarerOrt(meta.ort);
  const istBild = meta.art === 'bild';

  return (
    <>
      <h3>Aufnahme</h3>

      <dl>
        <Zeile k="Aufgenommen" w={datumLang(meta.aufgenommen)} />
        <Zeile k="Ort" w={ort?.name} />
        <Zeile k="Koordinaten" w={ort ? koordinaten(ort) : null} />
        <Zeile k="Höhe" w={ort?.hoehe ? `${ort.hoehe} m` : null} />
      </dl>

      <h3 className="bt-info-zwischen">Technik</h3>
      <dl>
        <Zeile k="Kamera" w={meta.kamera} />
        <Zeile k="Objektiv" w={meta.objektiv} />
        {istBild ? (
          <>
            <Zeile k="Blende" w={meta.blende ? `f/${meta.blende}` : null} />
            <Zeile k="Belichtung" w={meta.belichtung} />
            <Zeile k="ISO" w={meta.iso} />
            <Zeile
              k="Brennweite"
              w={meta.brennweite
                ? `${meta.brennweite} mm${meta.brennweiteKB ? ` · KB ${meta.brennweiteKB} mm` : ''}`
                : null}
            />
          </>
        ) : (
          <>
            <Zeile k="Länge" w={dauerText(meta.dauer)} />
            <Zeile k="Bildrate" w={meta.bilderProSekunde ? `${meta.bilderProSekunde} Bilder/s` : null} />
            <Zeile k="Codec im Original" w={meta.codec?.toUpperCase()} />
            <Zeile k="Datenrate" w={meta.bitrate ? `${Math.round(meta.bitrate / 1000)} Mbit/s` : null} />
            <Zeile k="Ton" w={meta.ton?.toUpperCase()} />
            <Zeile k="Software" w={meta.software} />
          </>
        )}
        <Zeile k="Auflösung" w={megapixel(meta.breite, meta.hoehe)} />
        <Zeile k="Original" w={groesse(meta.bytes)} />
      </dl>

      {ort && (
        <a
          className="bt-osm"
          href={`https://www.openstreetmap.org/?mlat=${ort.lat}&mlon=${ort.lon}#map=14/${ort.lat}/${ort.lon}`}
          target="_blank"
          rel="noreferrer"
        >
          Auf OpenStreetMap ansehen ↗
        </a>
      )}

      <p className="bt-rechte">
        {RECHTE}
        <button className="bt-zu-schliessen" onClick={onAbschliessen}>wieder abschließen</button>
      </p>
    </>
  );
}

function Zeile({ k, w }: { k: string; w: string | number | null | undefined }) {
  if (w === null || w === undefined || w === '') return null;
  return (
    <>
      <dt>{k}</dt>
      <dd>{w}</dd>
    </>
  );
}
