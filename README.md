# S-N — Simba & Nala

> Benannt nach Simba und Nala. Alles hier dreht sich darum, dass ein Tier
> im Ernstfall schneller Hilfe bekommt.

Dieses Repository sammelt die Projekte rund um tierärztliche Soforthilfe in
Kärnten. Der Code liegt **nicht auf `main`** — dort steht nur die Projektidee.
Jede Fassung hat ihren eigenen Branch:

| Branch | Was drin ist |
|--------|--------------|
| `main` | nur die README mit der Projektidee |
| **`alles`** | **alles zusammen — dieser Branch hier** |
| `vetnow-app` | nur VetNow: Website/WebApp, Handy-App, Extension (ohne Studio, ohne Docker) |
| `pages` | der Quellcode der GitHub-Pages-Seite (Landing + Gedenkseite) |

---

## Was in `alles` liegt

```
apps/
├── vetnow/                  Notfall-Tierarzt-Finder Kärnten — der Hauptteil
│   ├── web/                 Website + installierbare PWA (Vite, React 19)
│   ├── mobile/              iPhone-/Android-App (Expo, React Native)
│   ├── extension/           Chrome-Erweiterung (Praxis-Popup, Manifest V3)
│   ├── studio/              Control-Panel: bauen, vorschauen, starten
│   ├── avocado/             Zusatzteil
│   └── docker-compose*.yml  Betrieb auf ZimaOS/Docker
├── pfotennotruf-kaernten/   Anlaufstelle für Tiernotfälle (Next.js 16, React 19)
└── pfotennotruf-mvp/        dieselbe Aufgabe, von einem anderen Assistenten gebaut
```

`pfotennotruf-kaernten` und `pfotennotruf-mvp` sind bewusst zwei Anläufe an
derselben Aufgabe — gedacht zum Vergleichen, nicht als Dublette.

## Loslegen

```bash
# Website / PWA
cd apps/vetnow/web && npm install && npm run dev

# Handy-App
cd apps/vetnow/mobile && npm install && npx expo start

# Pfotennotruf
cd apps/pfotennotruf-kaernten && npm install && npm run dev
```

## Hinweise

- Alle Praxisdaten in VetNow sind **Platzhalter-Testdaten**
  (Telefonnummern `+43 000 000000` usw.) — keine echten Kontaktdaten.
- Die Anmeldung ist rein clientseitig (localStorage), kein Server, kein Konto.
  Sie schützt nichts und ist nur dafür da, die Oberfläche zeigen zu können.
- VetNow läuft zusätzlich auf dem ZimaOS-Server im Heimnetz; die
  GitHub-Pages-Seite (Branch `pages`) verlinkt dorthin.
