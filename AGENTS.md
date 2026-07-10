# AGENTS.md — Arbeitsweise & Konventionen

## Ziel
Bogen für **SF1e** (Paizo, deutsche Ausgabe Ulisses-Spiele) als
plattformübergreifende PWA — inhaltlich und funktional auf Augenhöhe mit dem
bestehenden Pathfinder-1e-Bogen (`pf1-bogen`, Schwesterprojekt).

## Herkunft dieses Projekts
Entstanden aus einer Diskussion im `pf1-bogen`-Projekt (2026-07-07): die Frage
war, ob man Pathfinder und SF1e in derselben App/Engine abbilden kann.
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
**SF1e-Regelwerk**, deutsche Ausgabe (Ulisses-Spiele), Original von Paizo
(2017). 530 Seiten.

## Warum kein Umbau der Pathfinder-Engine (Entscheidung, festgezurrt 2026-07-07)
SF1e teilt zwar die Grundarchitektur mit Pathfinder 1e (Völker, Klassen,
Fertigkeiten, Talente, Zauber, Ausrüstung, Kampf — dieselbe Paizo-d20-Denke),
aber mehrere Kernmechaniken sind **fundamental anders**, nicht nur andere
Zahlen in denselben Formeln:

| Mechanik | Pathfinder 1e | SF1e |
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
  passen zufällig 1:1 zu SF1e, aber `hp`/`gear`/`spellbook`/etc. müssen
  an das TP/Ausdauer/Reserve- bzw. EAC/KAC-Modell von SF1e angepasst werden).
- **Gist-Backup** (`store/useGistSync.js`, `components/GistSyncPanel.jsx`) —
  unverändert übernommen, nur `pf1_*`-localStorage-Keys → `sf1_*` umbenannt
  (sonst würden beide Apps sich im selben Browser die Daten überschreiben).
- **Homebrew-Grundgerüst** (`store/useHomebrew.js`, `components/HomebrewPanel.jsx`)
  — Struktur übernommen, Inhalte (Kategorien: classes/races/weapons/armor/shields)
  müssen für SF1e überprüft/angepasst werden.
- **`CharacterDrawer.jsx`** — Charakterliste/-Umschalter, spielsystem-neutral.
- Einige weitere Komponenten wurden kopiert, weil sie beim Import-Check
  "sauber" waren (kein direkter `data/`/`engine/`-Import): `AttributeBlock.jsx`,
  `BioSection.jsx`, `ConditionsPanel.jsx`, `InventoryTab.jsx`,
  `ResourcesPanel.jsx`, `XpTracker.jsx`. **Achtung:** "sauber" heißt nur "baut
  ohne Fehler" — der **Inhalt** ist teils trotzdem Pathfinder-spezifisch
  hardcodiert (z.B. `ConditionsPanel.jsx` hat vermutlich Pathfinders 22
  Zustände fest im Code, keine SF1e-Zustände). Vor Verwendung prüfen,
  nicht blind für bare Münze nehmen.

## Was komplett entfernt wurde (nicht wiederverwendbar)
`data/*.json`, `engine/*.js` (attributes/classes/combat/skills/weapons/
spellSlots/buffs/conditions/index) sowie alle eng gekoppelten Tab-Komponenten:
`BuffTracker`, `ClassFeaturesPanel`, `ClassSection`, `CombatTab`, `DomainsPanel`,
`FeatsTab`, `NotesTab`, `PrintView`, `RaceSelector`, `SkillsTab`, `SpellsTab`,
`WeaponsTab`. Diese müssen für SF1e komplett neu gebaut werden — nicht
weil das Muster schlecht wäre, sondern weil Inhalt und Rechenlogik nicht passen.

`App.jsx` ist aktuell ein **Platzhalter** mit 6 Dummy-Tabs (Charakter/Kampf/
Ausrüstung/Zauber/Raumschiff/Notizen), die nur "noch nicht gebaut" anzeigen.
Muss durch echte SF1e-Tabs ersetzt werden, sobald Daten+Engine existieren.

## PDF-Extraktion — anderes Vorgehen als bei Pathfinder
**Wichtiger Unterschied:** Pathfinders Excel hatte fertig berechnete Zellwerte
als Referenz-Wahrheit — die Engine ließ sich gegen echte Zahlen testen. Ein
PDF-Regelbuch hat das nicht, nur Fließtext + Tabellen. Deshalb:

1. **Textextraktion**: `pdftotext -layout -f <von> -l <bis> SF1e_Regelwerk_(PDF).pdf -`
   pro Kapitel/Abschnitt. Funktioniert brauchbar für Fließtext, weniger
   zuverlässig für mehrspaltige Tabellen (Klassen-Stufenprogression,
   Ausrüstungslisten mit vielen Spalten).
2. Für komplexere Tabellen ggf. `pdfplumber` (Python, tabellenerkennend)
   statt `pdftotext` — noch nicht ausprobiert, erster Testlauf steht aus.
3. **Verifikation ohne Referenzwerte**: Formeln direkt aus dem Fließtext
   implementieren (das Regelbuch hat eingebaute Rechenbeispiele, z.B. das
   Attributssteigerungs-Beispiel auf S. 24) und dagegen testen. Zusätzlich
   Stichproben gegen eine deutsche SF1e-SRD-Website, falls es sowas
   gibt (analog zu `prd.5footstep.de`, das `pf1-bogen` für Verweislinks
   nutzt — noch nicht geprüft, ob es ein SF1e-Äquivalent gibt).
4. Das ist von Natur aus fehleranfälliger als der Excel-Zellenabgleich —
   **das offen als Einschränkung behandeln, nicht verschweigen.** Bei
   Unsicherheit über eine Formel: im Buch nachschlagen (Seitenzahl notieren),
   nicht raten.

Die PDF selbst (`SF1e_Regelwerk_(PDF).pdf`, ~210 MB, 530 Seiten)
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
11. Spielleiten — S. 386 (GM-Kapitel, für den Bogen nicht relevant)
12. Hintergrund — S. 422 (Lore/Setting, für den Bogen nicht relevant)

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
Dieses Repo läuft über einen **strikt persönlichen Account** — niemals mit dem
Lotuscrafts-Account verbinden (unabhängig davon, dass das GitHub-Repo selbst
öffentlich ist, siehe „Sicherheit / Repo öffentlich" unten — das betrifft nur
die Sichtbarkeit, nicht den Account). Es nutzt denselben dedizierten
SSH-Key/Host-Alias wie `pf1-bogen`:

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

## Sicherheit / Repo öffentlich (Pflicht, keine Ausnahme)
Das Repo ist öffentlich (nötig für kostenloses GitHub Pages Hosting). Die
extrahierten Regelinhalte stammen aus einem gekauften Buch — der Systemname
und das deutsche Wort für „Figuren-Datenblatt" (siehe Regex in
`.githooks/pre-commit`) dürfen nirgends im Repo vorkommen (Code, Kommentare,
Doku, Dateinamen) — sonst wäre das Repo über GitHubs Code-Suche nach genau
diesen Begriffen auffindbar, obwohl der Inhalt an den Buchkauf gebunden ist.
Stattdessen: „SF1e", „Bogen", „Blatt", „Sheet".

- **Durchsetzung automatisch**: Pre-Commit-Hook (`.githooks/pre-commit`)
  blockiert Commits mit den verbotenen Wörtern in den staged Changes, plus
  CI-Check als Netz im Deploy-Workflow. Pro Klon einmalig aktivieren:
  `git config core.hooksPath .githooks`.
- **Ausnahme**: `.githooks/pre-commit` und `.github/workflows/deploy.yml`
  selbst brauchen die Wörter zwangsläufig, um die Regel zu definieren (per
  Regex ausgeschlossen, sonst würden sie sich selbst blockieren).
- Git-Historie ist NICHT rückwirkend bereinigt (kein `git filter-repo`) — zu
  invasiv für den Nutzen, alte Commits enthalten die Wörter noch. Bekanntes,
  akzeptiertes Restrisiko.
- `robots.txt` (Disallow: /) + `<meta name="robots" content="noindex, ...">`
  in `index.html` sollen zusätzlich verhindern, dass Suchmaschinen die
  Live-Seite indexieren.
- GitHub-Repo-Metadaten (Description/Topics) müssen ebenfalls frei von den
  Begriffen bleiben — prüfen mit `gh api repos/<owner>/sf1-bogen --jq
  '{name, description, topics}'`.

## Mobile/PWA-Test
Analog zu `pf1-bogen`: Layout (Portrait UND Landscape) vor „fertig" mit dem
iOS-Preview-Rig prüfen (`~/.claude/tools/ios-preview/shoot.js`).
