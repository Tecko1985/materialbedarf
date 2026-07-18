const APP_VERSION = "1.0";

const APP_CHANGELOG = [
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
        title: "Verwaltung (Admin/Bearbeiter)",
        items: [
          "Annehmen/Ablehnen/Als gekauft markieren sowie Löschen fremder Meldungen sind an das Bearbeiten-Recht der Gruppen-Verwaltung gekoppelt, nicht an Admin-Status allein.",
          "Alle Meldungen im Überblick, filterbar nach Status (Offen/Angenommen/Abgelehnt/Gekauft).",
          "Meldungen annehmen oder ablehnen, angenommene als gekauft markieren, dazu ein Admin-Kommentar je Meldung.",
          "Export als Text- oder PDF-Datei, passend zum aktuell gewählten Status-Filter."
        ]
      }
    ]
  }
];
