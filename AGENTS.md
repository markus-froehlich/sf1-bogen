# AGENTS.md — Arbeitsweise & Konventionen

## Ziel
Charakterbogen für **Starfinder** (Paizo, deutsche Ausgabe Ulisses-Spiele) als
plattformübergreifende PWA — inhaltlich und funktional auf Augenhöhe mit dem
bestehenden Pathfinder-1e-Bogen (`pf1-bogen`, Schwesterprojekt).

## Herkunft dieses Projekts
Entstanden aus einer Diskussion im `pf1-bogen`-Projekt (2026-07-07): die Frage
war, ob man Pathfinder und Starfinder in derselben App/Engine abbilden kann.
Antwort: **nein, nicht sinnvoll** — zu viele Kernmechaniken unterscheiden sich
fundamental (siehe unten). Deshalb: eigenes Repo, eigener Rechenkern, aber
**gleiches Grundgerüst** (React+Vite+PWA-Chassis, Charakterverwaltung,
Gist-Backup, UI-Bausteine) 1:1 aus `pf1-bogen` übernommen und bereinigt.

**Wichtig für eine neue Session, die hier zum ersten Mal startet:** Diese
Datei + `STATUS.md` sind der einzige Kontext, der garantiert ankommt — das
ursprüngliche Gespräch, in dem das alles entschieden wurde, ist in einer
anderen Session/einem anderen Projektordner (`pf1-bogen`) und wird NICHT
automatisch mitgeliefert. Wenn hier was unklar ist, eher nachfragen als raten.

## Regelbasis
**Starfinder Grundregelwerk**, deutsche Ausgabe (Ulisses-Spiele), Originaltitel
„Starfinder Core Rulebook" (Paizo, 2017). 530 Seiten.

## Warum kein Umbau der Pathfinder-Engine (Entscheidung, festgezurrt 2026-07-07)
Starfinder teilt zwar die Grundarchitektur mit Pathfinder 1e (Völker, Klassen,
Fertigkeiten, Talente, Zauber, Ausrüstung, Kampf — dieselbe Paizo-d20-Denke),
aber mehrere Kernmechaniken sind **fundamental anders**, nicht nur andere
Zahlen in denselben Formeln:

| Mechanik | Pathfinder 1e | Starfinder |
|---|---|---|
| Rüstungsklasse | eine RK | **zwei**: EAC (Energie) + KAC (Kinetik) |
| Trefferpunkte | ein TP-Pool | **drei** Pools: Ausdauerpunkte (schnell regenerierend) + Trefferpunkte + Reservepunkte (Ressource für Klassenmerkmale/Stabilisieren) |
| Attributssteigerung | +1 auf 1 Attribut alle 4 Stufen | +1 (falls Wert ≥17) oder +2 (falls ≤16) auf **4 Attribute gleichzeitig** alle 5 Stufen |
| Ausrüstungs-Ökonomie | GP-Wert lose nach Stufe | **Gegenstandsstufen**-System; zusätzlich Computer/Hacking, Augmentierungen (Cyberware), Hybrid-Gegenstände |
| Raumschiffe | — nicht vorhanden — | **eigenes Subsystem**: Schiffbau (Rumpf/Antrieb/Slots), Crew-Rollen, Schiff-gegen-Schiff-Kampf — ~40 Seiten, quasi ein zweites Mini-Spiel |

Ergebnis: eigener Rechenkern (`engine/`), eigene Daten (`data/`), damit
Pathfinders gut getesteter Rechenkern nicht mit spielsystem-abhängigen
Sonderfällen verunreinigt wird.

## Was aus `pf1-bogen` 1:1 übernommen wurde (Stand 2026-07-07, erster Commit)
- **App-Chassis**: Vite + React + `vite-plugin-pwa`, Dark-Theme-CSS-Tokens
  (`index.css`), Topbar/Bottom-Nav-Grundstruktur (`App.css`).
- **Charakterverwaltung** (`store/useCharacters.js`) — mehrere Charaktere,
  localStorage, Export/Import, SP/SL-Profile. **Komplett spielsystem-neutral**,
  keine Pathfinder-Kopplung gefunden (verifiziert per grep vor dem Kopieren).
  `DEFAULT_CHAR`-Struktur ist aber noch Pathfinder-geprägt (ST/GE/KO/IN/WE/CH
  passen zufällig 1:1 zu Starfinder, aber `hp`/`gear`/`spellbook`/etc. müssen
  an Starfinders TP/Ausdauer/Reserve- bzw. EAC/KAC-Modell angepasst werden).
- **Gist-Backup** (`store/useGistSync.js`, `components/GistSyncPanel.jsx`) —
  unverändert übernommen, nur `pf1_*`-localStorage-Keys → `sf1_*` umbenannt
  (sonst würden beide Apps sich im selben Browser die Daten überschreiben).
- **Homebrew-Grundgerüst** (`store/useHomebrew.js`, `components/HomebrewPanel.jsx`)
  — Struktur übernommen, Inhalte (Kategorien: classes/races/weapons/armor/shields)
  müssen für Starfinder überprüft/angepasst werden.
- **`CharacterDrawer.jsx`** — Charakterliste/-Umschalter, spielsystem-neutral.
- Einige weitere Komponenten wurden kopiert, weil sie beim Import-Check
  "sauber" waren (kein direkter `data/`/`engine/`-Import): `AttributeBlock.jsx`,
  `BioSection.jsx`, `ConditionsPanel.jsx`, `InventoryTab.jsx`,
  `ResourcesPanel.jsx`, `XpTracker.jsx`. **Achtung:** "sauber" heißt nur "baut
  ohne Fehler" — der **Inhalt** ist teils trotzdem Pathfinder-spezifisch
  hardcodiert (z.B. `ConditionsPanel.jsx` hat vermutlich Pathfinders 22
  Zustände fest im Code, keine Starfinder-Zustände). Vor Verwendung prüfen,
  nicht blind für bare Münze nehmen.

## Was komplett entfernt wurde (nicht wiederverwendbar)
`data/*.json`, `engine/*.js` (attributes/classes/combat/skills/weapons/
spellSlots/buffs/conditions/index) sowie alle eng gekoppelten Tab-Komponenten:
`BuffTracker`, `ClassFeaturesPanel`, `ClassSection`, `CombatTab`, `DomainsPanel`,
`FeatsTab`, `NotesTab`, `PrintView`, `RaceSelector`, `SkillsTab`, `SpellsTab`,
`WeaponsTab`. Diese müssen für Starfinder komplett neu gebaut werden — nicht
weil das Muster schlecht wäre, sondern weil Inhalt und Rechenlogik nicht passen.

`App.jsx` ist aktuell ein **Platzhalter** mit 6 Dummy-Tabs (Charakter/Kampf/
Ausrüstung/Zauber/Raumschiff/Notizen), die nur "noch nicht gebaut" anzeigen.
Muss durch echte Starfinder-Tabs ersetzt werden, sobald Daten+Engine existieren.

## PDF-Extraktion — anderes Vorgehen als bei Pathfinder
**Wichtiger Unterschied:** Pathfinders Excel hatte fertig berechnete Zellwerte
als Referenz-Wahrheit — die Engine ließ sich gegen echte Zahlen testen. Ein
PDF-Regelbuch hat das nicht, nur Fließtext + Tabellen. Deshalb:

1. **Textextraktion**: `pdftotext -layout -f <von> -l <bis> Starfinder_Grundregelwerk_(PDF).pdf -`
   pro Kapitel/Abschnitt. Funktioniert brauchbar für Fließtext, weniger
   zuverlässig für mehrspaltige Tabellen (Klassen-Stufenprogression,
   Ausrüstungslisten mit vielen Spalten).
2. Für komplexere Tabellen ggf. `pdfplumber` (Python, tabellenerkennend)
   statt `pdftotext` — noch nicht ausprobiert, erster Testlauf steht aus.
3. **Verifikation ohne Referenzwerte**: Formeln direkt aus dem Fließtext
   implementieren (das Regelbuch hat eingebaute Rechenbeispiele, z.B. das
   Attributssteigerungs-Beispiel auf S. 24) und dagegen testen. Zusätzlich
   Stichproben gegen eine deutsche Starfinder-SRD-Website, falls es sowas
   gibt (analog zu `prd.5footstep.de`, das `pf1-bogen` für Verweislinks
   nutzt — noch nicht geprüft, ob es ein Starfinder-Äquivalent gibt).
4. Das ist von Natur aus fehleranfälliger als der Excel-Zellenabgleich —
   **das offen als Einschränkung behandeln, nicht verschweigen.** Bei
   Unsicherheit über eine Formel: im Buch nachschlagen (Seitenzahl notieren),
   nicht raten.

Die PDF selbst (`Starfinder_Grundregelwerk_(PDF).pdf`, ~210 MB, 530 Seiten)
liegt im Projektordner, ist aber **gitignored** (`*.pdf` in `.gitignore`) —
Copyright, bleibt nur lokal.

## Kapitelübersicht (für Planung, Seitenzahlen aus dem Original-Inhaltsverzeichnis)
1. Überblick — S. 4
2. Charaktererschaffung — S. 12 (Attribute, Gesundheit/Reservepunkte,
   Gesinnung, Stufenaufstieg, Charaktermotive)
3. Völker — S. 38 (7 Stück: Androiden, Kasathas, Laschuntas, Menschen,
   Schirren, Vesken, Ysokis)
4. Klassen — S. 56 (7 Stück: Agent, Aspirant, Gesandter, Mechaniker,
   Solarier, Soldat, Technomagier + Archetypen)
5. Fertigkeiten — S. 130
6. Talente — S. 150
7. Ausrüstung — S. 164 (Waffen, Rüstungen, Aufwertungen, Computer,
   Technische Gegenstände, Magische Gegenstände, Hybride Gegenstände,
   Fahrzeuge, Sonstiges)
8. Taktische Regeln — S. 236 (Kampfgrundlagen, Aktionen, Verwundung/Tod,
   Kampfmodifikationen, Fortbewegung, Sinneswahrnehmung, Zustände,
   Fahrzeugregeln)
9. **Raumschiffe** — S. 288 (Weltraumreisen, Raumschiffe erstellen,
   Beispiel-Raumschiffe, Raumschiffskampf) — **eigene, spätere Phase**
10. Magie und Zauber — S. 328 (nur 2 Zauberklassen: Aspirant, Technomagier)
11. Spielleiten — S. 386 (GM-Kapitel, für den Charakterbogen nicht relevant)
12. Hintergrund — S. 422 (Lore/Setting, für den Charakterbogen nicht relevant)

## Tech-Stack (identisch zu `pf1-bogen`)
- React + Vite + PWA-Plugin; offline-fähig, „zum Homescreen hinzufügen".
- Berechnungs-Engine = reines, UI-unabhängiges JS-Modul, strikt von der UI getrennt.
- Charakterdaten lokal (localStorage), optionales GitHub-Gist-Backup.
- Export/Import: Charakter als JSON-Datei.

## Commit & Push — automatisch, ohne Rückfrage (seit 2026-07-09)
Nutzer-Freigabe, wortwörtlich erteilt: „ja auto commit und push". Das gilt
**nur für dieses Repo** (rein privat, dedizierter SSH-Key, siehe unten) und
überschreibt für dieses Projekt die sonst geltende Grundregel „nie ohne
explizite Freigabe pushen":
- Nach abgeschlossener, getesteter Arbeit (Build grün, im Preview verifiziert)
  selbstständig committen UND pushen — keine Rückfrage pro Commit/Push nötig.
- Gilt NICHT für die in „Git / Account-Trennung" unten weiterhin strikt
  geltenden Ausnahmen: niemals Account wechseln, niemals `gh auth switch`,
  niemals selbstständig einen neuen SSH-Key hinterlegen. Diese drei bleiben
  IMMER explizite-Freigabe-pflichtig, unabhängig von dieser Auto-Push-Regel.
- Bei destruktiven Git-Operationen (`push --force`, `reset --hard` auf schon
  gepushte Commits etc.) weiterhin vorher fragen — die Auto-Freigabe deckt
  nur den normalen „commit + push nach main"-Fall ab.

## Git / Account-Trennung (Pflicht, keine Ausnahme)
Dieses Repo ist **strikt privat** — niemals mit dem Lotuscrafts-Account
verbinden. Es nutzt denselben dedizierten SSH-Key/Host-Alias wie `pf1-bogen`:

- Remote: `git@github.com-private:markus-froehlich/sf1-bogen.git`
  (Alias `github.com-private` ist in `~/.ssh/config` fest an den privaten
  SSH-Key gebunden, unabhängig davon, welcher `gh`-Account gerade "aktiv" ist)
- **Niemals** `gh auth switch` zum Lotuscrafts-Account als "Test" ausführen,
  auch nicht lesend — das wurde im `pf1-bogen`-Projekt einmal versehentlich
  gemacht und vom Nutzer explizit als Grenzüberschreitung zurückgewiesen.
- Falls hier ein neuer SSH-Key gebraucht würde (aktuell nicht der Fall,
  derselbe Key wird wiederverwendet): niemals selbstständig per
  `gh ssh-key add` beim Account hinterlegen — das braucht explizite
  Nutzerbestätigung in genau diesem Wortlaut, sonst blockt das
  Sicherheitssystem es ohnehin.

## Mobile/PWA-Test
Analog zu `pf1-bogen`: Layout (Portrait UND Landscape) vor „fertig" mit dem
iOS-Preview-Rig prüfen (`~/.claude/tools/ios-preview/shoot.js`).
