const APP_VERSION = "1.1";

const APP_CHANGELOG = [
  {
    version: "1.1",
    groups: [
      {
        title: "Fehlerbehebungen",
        items: [
          "Zurückziehen löscht eine Meldung nur noch, solange sie wirklich noch offen ist — hatte ein Admin sie in der Zwischenzeit entschieden, blieb die Entscheidung vorher auf der Strecke.",
          "Der Admin-Kommentar wird bei bereits entschiedenen Meldungen (Abgelehnt/Gekauft) als Text angezeigt statt als Eingabefeld — Eingaben dort wurden nie gespeichert und gingen stillschweigend verloren."
        ]
      }
    ]
  },
  {
    version: "1.0",
    groups: [
      {
        title: "Bedarf melden",
        items: [
          "Trainer:innen melden Materialbedarf mit einer oder mehreren Positionen (Material + Menge), Grund/Verwendungszweck und Dringlichkeit (normal/dringend).",
          "Eigene Meldungen bleiben unter „Meine Meldungen“ mit aktuellem Status sichtbar; noch offene Meldungen können zurückgezogen werden.",
          "Anmeldung & Speicherung über die zentrale Anmeldung (Tools-Übersicht) — kein separates Passwort auf diesem Gerät nötig."
        ]
      },
      {
        title: "Verwaltung (nur Admins)",
        items: [
          "Alle Meldungen im Überblick, filterbar nach Status (Offen/Angenommen/Abgelehnt/Gekauft).",
          "Meldungen annehmen oder ablehnen, angenommene als gekauft markieren, dazu ein Admin-Kommentar je Meldung.",
          "Export als Text- oder PDF-Datei, passend zum aktuell gewählten Status-Filter."
        ]
      }
    ]
  }
];
