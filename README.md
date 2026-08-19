# VetNow — nur die Apps

> Teil von **S-N (Simba & Nala)**. Dieser Branch enthält VetNow ohne
> Studio und ohne Docker — nur das, was Nutzer:innen wirklich in die Hand
> bekommen.

Notfall-Tierarzt-Finder für Kärnten: Praxen nach Bezirk, Tierart und
Situation filtern, Status-Ampel (grün/gelb/grau/rot), Chat zwischen
Tierhalter:innen und Praxen, Praxis-Dashboard, Anmeldung.

| Ordner | Was | Technik |
|--------|-----|---------|
| `web/` | Website + installierbare PWA | Vite, React 19, vite-plugin-pwa |
| `mobile/` | iPhone-/Android-App | Expo (React Native), React Navigation |
| `extension/` | Chrome-Erweiterung (Praxis-Popup) | Manifest V3, reines JS |

## Branches in diesem Repository

| Branch | Was drin ist |
|--------|--------------|
| `main` | nur die README mit der Projektidee |
| `alles` | alles zusammen: VetNow komplett (mit Studio + Docker) und beide Pfotennotruf-Fassungen |
| **`vetnow-app`** | **dieser Branch — Web, Handy, Extension** |
| `pages` | Quellcode der GitHub-Pages-Seite (Landing + Gedenkseite) |

## Loslegen

```bash
# Website / PWA
cd web && npm install && npm run dev

# Handy-App (Expo)
cd mobile && npm install && npx expo start
```

Die Chrome-Erweiterung wird unter `chrome://extensions` mit
„Entpackte Erweiterung laden" aus `extension/` geladen.

## Hinweise

- Alle Praxisdaten sind **Platzhalter-Testdaten** (`+43 000 000000` usw.).
  Ohne die Umgebungsvariable `VITE_VN_CLEAN=true` läuft die Demo-Fassung
  mit Testdaten, Auto-Antwort-Bot und KI-Agent.
- Die Anmeldung liegt nur im Browser (localStorage) — kein Server, kein
  Konto, kein echter Schutz. Sie existiert, damit sich die Oberfläche
  vorführen lässt.
