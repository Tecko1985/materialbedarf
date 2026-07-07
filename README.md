# Materialbedarf (v1.0)

Meldeformular für Materialbedarf als eigenständige, clientseitige Web-App ohne
Build-Step (Vanilla HTML/CSS/JS) — Teil der
[Tools-Übersicht](https://tecko1985.github.io/ToolsUebersicht/) des 1. SC 1911
Heiligenstadt.

**Live:** https://tecko1985.github.io/materialbedarf/

---

## Funktionen

### Bedarf melden (Trainer:innen)
- Eine Meldung kann mehrere Materialien enthalten (Material + Menge je Position),
  dazu Grund/Verwendungszweck und Dringlichkeit (normal/dringend).
- Eigene Meldungen bleiben unter "Meine Meldungen" mit aktuellem Status sichtbar.
- Noch offene (nicht entschiedene) Meldungen können jederzeit zurückgezogen werden.

### Verwaltung & Export (nur Admins)
- Alle Meldungen im Überblick, filterbar nach Status (Offen/Angenommen/
  Abgelehnt/Gekauft-Erledigt).
- Meldungen annehmen oder ablehnen; angenommene zusätzlich als gekauft/erledigt
  markieren, sobald die Beschaffung abgeschlossen ist. Optionaler Kommentar je
  Meldung.
- Export als Text- oder PDF-Datei, passend zum gerade aktiven Status-Filter.

### Daten & Speicherung
- Automatische Nextcloud-Synchronisierung über die zentrale Anmeldung in der
  [Tools-Übersicht](https://tecko1985.github.io/ToolsUebersicht/): einmal dort
  anmelden, danach wird diese Seite automatisch geladen und gespeichert — auch
  am Handy, ohne WebDAV-Adresse, Benutzername oder App-Passwort auf dem Gerät.
- Nur wer das Tool in der Übersicht sehen darf, kann es öffnen (Gruppen-Rechte
  werden serverseitig geprüft).

---

## Lokal starten

`fetch()`-Aufrufe von einem `file://`-Origin verhalten sich inkonsistent (CORS).
Die App daher über einen lokalen Static-Server öffnen:

```
npx serve .
```

Hinweis: Die geteilte Anmeldung mit der Tools-Übersicht (`localStorage` unter
der Origin `tecko1985.github.io`) funktioniert nur auf der Live-Seite, nicht
unter `localhost`.

---

## Datenmodell

Eine JSON-Datei, zentral über den Login-Gateway der Tools-Übersicht in der
Vereins-Nextcloud gespeichert (siehe `db.js`, `GATEWAY_URL`/`GATEWAY_APP_ID`):

```js
{
  "meldungen": [
    {
      "id", "erstelltVon", "vorname", "nachname", "mannschaft",
      "positionen": [ { "material", "menge" } ],
      "grund", "dringlichkeit",
      "status",           // "offen" | "angenommen" | "abgelehnt" | "gekauft"
      "adminKommentar",
      "erstelltAm", "entschiedenAm", "entschiedenVon", "gekauftAm"
    }
  ]
}
```

Jede Meldung ist ein eigenständiger Eintrag mit eigenem Status-Verlauf (anders
als z.B. bei der Kleiderbestellung, wo es eine überschreibbare Sammelbestellung
pro Trainer gibt) — Meldungen sammeln sich über die Zeit an und bleiben auch
nach einer Entscheidung sichtbar.
