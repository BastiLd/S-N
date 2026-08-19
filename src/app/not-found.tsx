import Link from 'next/link';
import { Sterne, PfotenPaar } from '@/components/Himmel';

export default function NichtGefunden() {
  return (
    <section className="nacht" style={{ minHeight: '72svh', display: 'grid', placeItems: 'center' }}>
      <Sterne anzahl={110} saat={404} />
      <div className="wrap" style={{ textAlign: 'center', padding: '90px 22px' }}>
        <div style={{ opacity: 0.7 }}><PfotenPaar breite={70} /></div>
        <h1 style={{ marginTop: 22, fontSize: 'clamp(30px, 5vw, 48px)', color: 'var(--gold-2)' }}>
          Hier ist nichts
        </h1>
        <p className="lead" style={{ margin: '16px auto 0', maxWidth: '44ch', color: 'var(--hell-3)' }}>
          Diese Seite gibt es nicht — oder nicht mehr.
        </p>
        <Link className="btn btn-gold" href="/" style={{ marginTop: 30 }}>
          Zurück zum Anfang
        </Link>
      </div>
    </section>
  );
}
