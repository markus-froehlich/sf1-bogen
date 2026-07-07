# STATUS

_Stand: 2026-07-07_

## Wo wir stehen
**Projekt gerade erst angelegt.** Noch keine einzige Zeile Starfinder-Inhalt
(keine Daten, keine Rechenlogik) — nur das Grundgerüst steht, 1:1 aus
`pf1-bogen` kopiert und bereinigt. Die eigentliche Arbeit (PDF-Extraktion,
Daten-Port, Engine bauen) hat noch nicht begonnen.

## Entscheidungen (siehe AGENTS.md für Details)
1. **Eigener Rechenkern**, nicht in `pf1-bogen` integriert — Starfinders
   Kernmechanik (EAC/KAC, Ausdauer/TP/Reserve, Raumschiffe) ist zu anders.
2. **Gleiches Grundgerüst** wie `pf1-bogen` (React/Vite/PWA, Charakterverwaltung,
   Gist-Backup) — spart Zeit, ist spielsystem-neutral.
3. **Raumschiffe explizit zurückgestellt** — eigene, spätere Phase, kein Teil
   vom "Charakterbogen fertig"-Ziel.
4. **PDF-Extraktion statt Excel-Extraktion** — keine Referenz-Zahlen wie bei
   Pathfinder, Verifikation läuft über Buch-eigene Rechenbeispiele.

## Zuletzt erledigt
- Repo angelegt (`git init`), `.gitignore` (PDF + extraction/ + node_modules
  ausgeschlossen).
- App-Chassis aus `pf1-bogen/app` kopiert, bereinigt:
  - `data/`, `engine/` komplett gelöscht (Pathfinder-spezifisch).
  - Eng gekoppelte Tab-Komponenten gelöscht (BuffTracker, ClassFeaturesPanel,
    ClassSection, CombatTab, DomainsPanel, FeatsTab, NotesTab, PrintView,
    RaceSelector, SkillsTab, SpellsTab, WeaponsTab).
  - Behalten (spielsystem-neutral oder zumindest baubar):
    `store/useCharacters.js`, `store/useGistSync.js`, `store/useHomebrew.js`,
    `store/useCharacter.js`, `store/useSectionOrder.js`,
    `components/CharacterDrawer.jsx`, `components/GistSyncPanel.jsx`,
    `components/HomebrewPanel.jsx`, `components/AttributeBlock.jsx`,
    `components/BioSection.jsx`, `components/ConditionsPanel.jsx`,
    `components/InventoryTab.jsx`, `components/ResourcesPanel.jsx`,
    `components/XpTracker.jsx` — **aber**: Inhalt dieser "sauberen" Dateien
    ist teils trotzdem Pathfinder-geprägt (siehe AGENTS.md-Warnung), vor
    Nutzung durchsehen.
  - Alle `pf1_*`-localStorage-Keys → `sf1_*` umbenannt (useCharacters.js,
    useGistSync.js, useCharacter.js, useHomebrew.js, GistSyncPanel.jsx) —
    sonst würden sich beide Apps im selben Browser die Daten überschreiben.
  - `vite.config.js`: Basis-Pfad `/pf1-bogen/` → `/sf1-bogen/`, Manifest-Name
    „Starfinder Charakterbogen".
  - `App.jsx` komplett neu geschrieben als **Platzhalter**: Topbar (Name,
    Menü mit Export/Import/Homebrew/Gist-Backup), Bottom-Nav mit 6 Dummy-Tabs
    (Charakter/Kampf/Ausrüstung/Zauber/Raumschiff/Notizen), jeder Tab zeigt
    nur "noch nicht gebaut" an.
  - `npm install` + `npm run build` erfolgreich getestet, Dev-Server kurz
    angetestet (lädt korrekt, keine Fehler).
- PWA-Icons noch die alten Pathfinder-Platzhalter (`public/icons/pwa-*.png`)
  — müssen irgendwann durch Starfinder-eigene ersetzt werden, nicht dringend.
- **PDF-Extraktionspipeline getestet (2026-07-07), funktioniert:**
  `pdftotext -layout` reicht für das Völker-Kapitel aus, `pdfplumber` war
  nicht nötig. Wichtig: **PDF-Seitenzahlen ≠ gedruckte Seitenzahlen** — Offset
  ermittelt durch Suche nach Kapitelüberschriften im Volltext (siehe unten).
  Kapitel 3 (Völker) liegt auf **PDF-Seiten 40-57** (gedruckt S. 38-55,
  Offset +2). Befehl:
  `pdftotext -layout -f 40 -l 57 "Starfinder_Grundregelwerk_(PDF).pdf" extraction/kapitel3_voelker_raw.txt`
  Ergebnis liegt in `extraction/kapitel3_voelker_raw.txt` (gitignored, lokal).
  Qualität: gut lesbar, alle 7 Völker vollständig (Androiden, Kasathas,
  Laschuntas, Menschen, Schirren, Vesken, Ysokis) mit Attributsmodifikatoren,
  TP-Bonus, Volksmerkmalen (Fließtext) und Kultur-/Namens-Abschnitten. Die
  vertikale Kapitel-Navigationsleiste am Seitenrand (ÜBERSICHT/VÖLKER/
  KLASSEN/...) mischt sich als Störtext in die zweite Spalte, ist aber leicht
  als Rauschen erkennbar (kurze Einzelwörter zwischen Absätzen) und blockiert
  die Weiterverarbeitung nicht. Attributsboni-Kopfzeile pro Volk (z.B.
  "ANDROIDEN +2 GE +2 IN -2 CH 4 TP") wird über mehrere Zeilen verteilt,
  bleibt aber eindeutig zuordenbar. **Empfehlung für weitere Kapitel:** erst
  per `python3` das gesamte PDF einmal mit `pdftotext -layout` in eine Datei
  wandeln (`\f`-getrennte Seiten), dann per Skript nach Kapitelüberschriften
  suchen, um den Seiten-Offset zu bestimmen, statt zu raten.

## Nächste Schritte (in Reihenfolge)
1. ~~**PDF-Extraktionspipeline aufbauen und testen (Völker, Kapitel 3)**~~ —
   erledigt, siehe oben. Rohtext liegt vor, noch **nicht** strukturiert.
2. **Völker-Rohtext zu `data/races.json` strukturieren** — aus
   `extraction/kapitel3_voelker_raw.txt` die 7 Völker in eine strukturierte
   JSON überführen (Attributsmodifikatoren, TP, Größenkategorie/Kreaturenart,
   Volksmerkmale, Sprachen), analog zur `races.json`-Struktur bei Pathfinder.
   Noch nicht begonnen.
3. Fertigkeiten (Kapitel 5, S. 130-149) — auch klein, gutes zweites Dataset.
4. Attribut-/Fertigkeiten-Rechenkern (`engine/attributes.js`,
   `engine/skills.js`) — vermutlich einfacher als Pathfinders Version, da
   Starfinder weniger Sonderfälle hat (bisher keine Volks-Attributsboni-
   Eigenheit wie bei Pathfinder bekannt, muss aber noch geprüft werden).
5. Klassen (Kapitel 4, S. 56-129) — größter Brocken trotz nur 7 Klassen,
   74 Seiten mit Stufenprogressionen + Klassenmerkmalen.
6. Ausrüstung (Kapitel 7) + Kampfmechanik (Kapitel 8) — EAC/KAC,
   Ausdauer/TP/Reserve-System, Gegenstandsstufen.
7. Talente (Kapitel 6), Zauber (Kapitel 10 — nur 2 Zauberklassen).
8. Danach: `App.jsx` von Platzhalter auf echte Tabs umstellen.
9. **Raumschiffe (Kapitel 9) — eigene, spätere Phase**, erst wenn 1-8 stehen
   und die Gruppe tatsächlich Raumschiffkampf spielt.

## Offene Fragen (für die nächste Session zu klären, nicht vorentschieden)
- Gibt es eine deutsche Starfinder-SRD-Website analog zu `prd.5footstep.de`
  für Verweislinks? Noch nicht geprüft.
- `pdftotext -layout` vs. `pdfplumber` — für das Völker-Kapitel (Fließtext +
  einfache Attributstabelle) reichte `-layout` aus, `pdfplumber` war nicht
  nötig. Bleibt aber offen für spaltenreichere Tabellen (Klassen-
  Stufenprogression, Ausrüstungslisten) — dort ggf. noch nötig, erster Test
  steht bei Kapitel 4 (Klassen) an.
- Homebrew-Kategorien (aktuell aus Pathfinder übernommen: classes/races/
  weapons/armor/shields) — passen die 1:1 für Starfinder oder fehlt was
  (z.B. Augmentierungen/Cyberware als eigene Homebrew-Kategorie)?

## GitHub / Deploy
- Noch **kein** GitHub-Repo angelegt, noch kein Push. Passiert im nächsten
  Schritt dieser Session (2026-07-07), dann trägt sich dieser Abschnitt
  selbst nach mit Repo-URL und Deploy-Status.
- Wenn eingerichtet: analog zu `pf1-bogen` GitHub-Pages-Deploy via Actions,
  URL vermutlich `https://markus-froehlich.github.io/sf1-bogen/`.

## Hinweise
- PDF liegt lokal im Projektordner (`Starfinder_Grundregelwerk_(PDF).pdf`,
  ~210 MB), ist gitignored, bleibt nur auf diesem Rechner.
- Verifikations-Ansatz ohne Referenzwerte (siehe AGENTS.md) — bei jeder
  Formel die Seitenzahl im Regelwerk mit angeben, für spätere Nachprüfbarkeit.
