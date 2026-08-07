const APP_VERSION = "1.0";

const APP_CHANGELOG = [
  {
    version: "1.1",
    groups: [
      {
        title: "Bestellt und verteilt",
        items: [
          "Nach der Annahme hat eine Meldung zwei weitere Stationen: „Bestellt“, sobald das Material geordert ist, und „Verteilt“, sobald es bei der Mannschaft angekommen ist.",
          "Der Weg ist fest: Offen → Angenommen → Bestellt → Verteilt. Kein Schritt lässt sich überspringen; „Abgelehnt“ endet sofort.",
          "„Verteilt“ schließt den Vorgang ab — danach bleibt nur noch Löschen.",
          "Der Filter im Reiter „Bearbeitet“ trennt jetzt zwischen bestellt und verteilt: was noch beim Händler liegt, steht damit nicht mehr zwischen dem Erledigten.",
          "Der Kommentar bleibt bis zur Verteilung änderbar und wird mit jedem Schritt mitgespeichert.",
          "Der frühere Stand „Gekauft/Erledigt“ heißt jetzt „Bestellt“. Die vorhandenen Meldungen stehen deshalb auf „Bestellt“ — was schon draußen ist, lässt sich einmalig auf „Verteilt“ nachziehen."
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
          "Trainerinnen und Trainer melden Materialbedarf mit einer oder mehreren Positionen aus Material und Menge, dazu Grund oder Verwendungszweck und die Dringlichkeit — normal oder dringend.",
          "Die eigenen Meldungen bleiben unter „Meine Meldungen“ mit ihrem aktuellen Stand sichtbar.",
          "Eine noch offene Meldung lässt sich zurückziehen."
        ]
      },
      {
        title: "Entscheiden",
        items: [
          "Der Reiter „Verwaltung“ zeigt ausschließlich die offenen Meldungen — was noch zu entscheiden ist, steht sofort im Blick.",
          "Entschiedene Meldungen stehen im Reiter „Bearbeitet“ und sind dort nach Status filterbar.",
          "Der weitere Stand einer angenommenen Meldung lässt sich in beiden Reitern setzen.",
          "Zu jeder Meldung kann ein Kommentar hinterlegt werden.",
          "Beide Reiter haben einen Export als Text oder PDF — jeweils genau die Meldungen, die gerade angezeigt werden."
        ]
      },
      {
        title: "Benachrichtigung aufs Handy",
        items: [
          "Eine neue Meldung erreicht die Zuständigen direkt aufs Handy, statt liegen zu bleiben, bis jemand von sich aus nachsieht.",
          "Ist über eine Meldung entschieden worden, bekommt die meldende Person eine Nachricht.",
          "Die Nachricht nennt weder den gemeldeten Bedarf noch das Ergebnis — sie steht auf dem Sperrbildschirm. Was entschieden wurde, sieht man nach dem Antippen.",
          "Eingeschaltet wird das in der Tools-Übersicht unter „Mein Konto“, einzeln für dieses Werkzeug. Wer es nicht einschaltet, merkt keinen Unterschied.",
          "Wurde eine Meldung zwischenzeitlich schon von jemand anderem entschieden, geht keine zweite Nachricht raus."
        ]
      },
      {
        title: "Wer darf was",
        items: [
          "Sehen: die eigenen Meldungen. Das Melde-Formular erscheint nicht, eine Meldung anlegen geht nicht — auch nicht am Bildschirm vorbei.",
          "Bearbeiten: Bedarf melden und eigene offene Meldungen zurückziehen.",
          "Administrieren: annehmen, ablehnen, den weiteren Stand setzen, kommentieren, fremde Meldungen löschen und exportieren. Die Reiter „Verwaltung“ und „Bearbeitet“ sind nur auf dieser Stufe sichtbar.",
          "Die Trennung ist Absicht: Bedarf melden ist die tägliche Arbeit, über Geld entscheiden ist es nicht.",
          "Der Reiter „Info“ ist für alle sichtbar."
        ]
      },
      {
        title: "Bedienung am Handy",
        items: [
          "Die Reiterleiste bricht am Handy um, statt seitlich aus dem Bild zu laufen — auch die hinteren Reiter sind auf schmalen Bildschirmen erreichbar.",
          "Eingabefelder sind mindestens 16 Pixel groß, damit der iPhone-Browser beim Antippen nicht ungefragt in die Seite hineinzoomt und verschoben stehen bleibt."
        ]
      },
      {
        title: "Daten & Speicherung",
        items: [
          "Gespeichert wird in der Vereins-Nextcloud über die zentrale Anmeldung der Tools-Übersicht — ein eigenes Passwort braucht es nicht."
        ]
      }
    ]
  }
];
