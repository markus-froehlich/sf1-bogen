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

## Nächste Schritte (in Reihenfolge)
1. **PDF-Extraktionspipeline aufbauen** — `pdftotext -layout` testen,
   ggf. `pdfplumber` für Tabellen. Start mit dem kleinsten Kapitel:
   **Völker (Kapitel 3, S. 38-55, 7 Einträge)** als Pipeline-Test, analog zu
   `races.json` bei Pathfinder (dort war das auch das erste, musterbildende
   Dataset).
2. Fertigkeiten (Kapitel 5, S. 130-149) — auch klein, gutes zweites Dataset.
3. Attribut-/Fertigkeiten-Rechenkern (`engine/attributes.js`,
   `engine/skills.js`) — vermutlich einfacher als Pathfinders Version, da
   Starfinder weniger Sonderfälle hat (bisher keine Volks-Attributsboni-
   Eigenheit wie bei Pathfinder bekannt, muss aber noch geprüft werden).
4. Klassen (Kapitel 4, S. 56-129) — größter Brocken trotz nur 7 Klassen,
   74 Seiten mit Stufenprogressionen + Klassenmerkmalen.
5. Ausrüstung (Kapitel 7) + Kampfmechanik (Kapitel 8) — EAC/KAC,
   Ausdauer/TP/Reserve-System, Gegenstandsstufen.
6. Talente (Kapitel 6), Zauber (Kapitel 10 — nur 2 Zauberklassen).
7. Danach: `App.jsx` von Platzhalter auf echte Tabs umstellen.
8. **Raumschiffe (Kapitel 9) — eigene, spätere Phase**, erst wenn 1-7 stehen
   und die Gruppe tatsächlich Raumschiffkampf spielt.

## Offene Fragen (für die nächste Session zu klären, nicht vorentschieden)
- Gibt es eine deutsche Starfinder-SRD-Website analog zu `prd.5footstep.de`
  für Verweislinks? Noch nicht geprüft.
- `pdftotext -layout` vs. `pdfplumber` für Tabellenextraktion — noch kein
  Vergleichstest gemacht, erster Extraktionslauf wird das zeigen.
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
