# STATUS

_Stand: 2026-07-07_

## Wo wir stehen
**Erster durchgehender Charakterbogen-Durchlauf steht.** Volk wählen → Klasse
wählen → Attribute eintragen → TP/AP/RP, EAC/KAC, Fertigkeiten, Angriffsbonus
und Zauberliste werden korrekt live berechnet. Alle 7 Kern-Datenkapitel des
Regelwerks (Völker, Fertigkeiten, Klassen, Ausrüstung/Kampf, Talente, Zauber)
sind extrahiert und in der App verdrahtet. Nur Raumschiffe (Kapitel 9, bewusst
zurückgestellt) und einige bewusst zurückgestellte Detail-Unterlisten fehlen
noch — siehe „Bekannte Lücken" unten.

## Entscheidungen (siehe AGENTS.md für Details)
1. **Eigener Rechenkern**, nicht in `pf1-bogen` integriert — Starfinders
   Kernmechanik (EAC/KAC, Ausdauer/TP/Reserve, Raumschiffe) ist zu anders.
2. **Gleiches Grundgerüst** wie `pf1-bogen` (React/Vite/PWA, Charakterverwaltung,
   Gist-Backup) — spart Zeit, ist spielsystem-neutral.
3. **Raumschiffe explizit zurückgestellt** — eigene, spätere Phase, kein Teil
   vom "Charakterbogen fertig"-Ziel.
4. **PDF-Extraktion statt Excel-Extraktion** — keine Referenz-Zahlen wie bei
   Pathfinder; Verifikation lief über Buch-eigene Rechenbeispiele (Kapitel 2)
   und Stichproben-Gegenchecks der Sub-Agenten-Ergebnisse gegen die Rohtexte.
5. **Große Kapitel per parallelen Sub-Agenten extrahiert**: pro Kapitel/
   Unterabschnitt erst `pdftotext -layout` in eine Rohtext-Datei
   (`extraction/kapitel<N>_<name>_raw.txt`, gitignored), dann je ein Agent
   pro Datei strukturiert daraus JSON — strikt nur aus dem gelieferten
   Rohtext, mit Anweisung Unsicherheiten explizit zu flaggen statt zu raten.
   Ergebnisse danach stichprobenhaft von Hand gegen die Rohtexte geprüft.
6. **Umfangreiche Unterwahl-Listen bewusst nicht vollständig erfasst**
   (Agententricks, Kampfstile, Sternenoffenbarungen, Magische Hacks,
   Rüstungsverbesserungen, volle Zauberbeschreibungen, Fahrzeuge, etc.) —
   das wäre ein Vielfaches des bisherigen Aufwands gewesen. Jede Lücke ist
   im jeweiligen `_meta`/`notes`-Feld der betroffenen JSON-Datei UND unten
   in „Bekannte Lücken" dokumentiert, damit nichts still verschwindet.

## Datenstand (`app/src/data/`)
| Datei | Inhalt | Quelle (Buch) |
|---|---|---|
| `races.json` | 7 Völker, Attributsmods, TP, Merkmale, Vitalwerte | Kapitel 3, S. 38-55 |
| `skills.json` | 20 Fertigkeiten, Schlüsselattribut, Klassenzuordnung | Kapitel 5, S. 130-149 |
| `classes.json` | 7 Klassen, volle 20-Stufen-Tabellen, Merkmale | Kapitel 4, S. 56-129 |
| `archetypes.json` | Archetypen-Mechanismus + 2 Beispiele | Kapitel 4, S. 126-129 |
| `weapons.json` | ~350 Waffen über 13 Tabellen + Glossare | Kapitel 7, S. 168-195 |
| `armor.json` | 42 leichte + 38 schwere + 5 Servorüstungen | Kapitel 7, S. 196-207 |
| `conditions.json` | 35 Zustände mit voller Beschreibung | Kapitel 8, S. 273-277 |
| `equipment_rules.json` | Credits, Gegenstandsstufen-Zugang, Tragkapazität | Kapitel 7, S. 166-167 |
| `feats.json` | 97 Talente (Tabelle 6-1, Kurzfassung) | Kapitel 6, S. 150-164 |
| `spells.json` | Zauberregeln + 131/130 Zauber (Aspirant/Technomagier) | Kapitel 10, S. 328-339 |

Engine-Module (`app/src/engine/`): `attributes.js` (Modifikator, Stufenaufstieg),
`skills.js` (Fertigkeitsbonus), `resources.js` (TP/AP/RP), `combat.js`
(EAC/KAC, Angriffswurf, Massiver Schaden), `equipment.js` (Gegenstandsstufen-
Zugang, Tragkapazität), `characterStats.js` (aggregiert alles zu einem
Kennwerte-Objekt pro Charakter — zentrale Stelle für alle Tabs).

Alle Engine-Formeln wurden gegen die im Buch selbst vorgerechneten Beispiele
verifiziert (nicht nur aus dem Fließtext abgeleitet).

## UI-Stand (`app/src/components/`)
`App.jsx` hat jetzt echte Tabs statt Platzhalter:
- **Charakter** (`CharacterTab.jsx`): Volk/Klasse/Stufe wählen, Attribute
  (Wert bereits inkl. Volksmod, wie im Buch/pf1-bogen üblich), TP/AP/RP mit
  aktuellem Wert + „voll auffüllen", GAB/Rettungswürfe, 20-Fertigkeiten-
  Tabelle mit Rang-Eingabe und Live-Bonus, Volksmerkmale und Klassenmerkmale
  bis zur aktuellen Stufe als Referenztext.
- **Kampf** (`CombatTab.jsx`): EAC/KAC live (abhängig von angelegter Rüstung
  + GE-Mod), Angriffsrechner (Waffe wählen → Angriffsbonus/Schaden aus
  `weapons.json`), Zustände-Toggle-Liste (alle 35 aus `conditions.json`).
- **Ausrüstung** (`GearTab.jsx`): Credits, Rüstung ausrüsten (setzt EAC/KAC),
  Waffen/Rüstungen aus dem Katalog ins Inventar, einfache Inventarliste.
- **Zauber** (`SpellsTab.jsx`): nur für Aspirant/Technomagier — Zauberplätze
  pro Tag (aus `classes.json`), bekannte Zauber pro Grad antippen/abwählen
  aus der vollen Zauberliste.
- **Raumschiff**: bewusst weiterhin Platzhalter (siehe Entscheidung 3).
- **Notizen**: einfaches Textfeld (ersetzt den alten Platzhalter).

**Getestet:** Build (`npm run build`) grün, manuell im Dev-Server durchgeklickt
(Vesk/Soldat Stufe 3 → TP 27/AP 21/RP 5/GAB+3/Angriffsbonus+7 — alle Werte von
Hand gegen die Formeln nachgerechnet, stimmen), sowie mobiles Layout via
iOS-Preview-Rig (`~/.claude/tools/ios-preview/shoot.js`) in Portrait UND
Landscape geprüft — kein Overflow, Bottom-Nav bleibt sichtbar.

**Store-Änderung:** `useCharacters.js` `DEFAULT_CHAR` um vier Starfinder-Felder
ergänzt (`credits`, `equipped`, `resources_current`, `spells_known`) — additiv,
nichts Bestehendes entfernt. Alte Pathfinder-Felder (`buffs`, `xp`, `domains`,
`magic_slots` etc.) sind noch im Objekt, werden aber von keinem Starfinder-Tab
mehr gelesen; Aufräumen wäre ein separater, risikoarmer Schritt.

**`ConditionsPanel.jsx`, `InventoryTab.jsx`, `ResourcesPanel.jsx`** (aus
pf1-bogen übernommen, Pathfinder-geprägt) werden von den neuen Tabs NICHT
mehr verwendet — `CombatTab`/`GearTab` haben eigene, schlankere Starfinder-
Versionen der gleichen Grundidee. Die alten Dateien liegen noch im Repo
(toter Code), könnten in einem Aufräum-Schritt gelöscht werden.

## Bekannte Lücken (bewusst zurückgestellt, nicht vergessen)
- **Raumschiffe (Kapitel 9)** — eigene, spätere Phase, startet erst wenn die
  Gruppe tatsächlich Raumschiffkampf spielt.
- **Umfangreiche Klassen-Unterwahllisten** nicht einzeln erfasst: Agententricks
  (~35-40), Mechanikertricks, Kampfstile (7×5 Stiltechniken), Sternenoffen-
  barungen (~40+), Magische Hacks (~25-30), Aspiranten-Verbindungen (7, je
  mit eigener Zauberliste), Drohnenchassis/-modifikationen/-talente. Nur als
  Kategorie mit Fundstelle in `classes.json` `notes` vermerkt.
- **Ausrüstung**: Rüstungsverbesserungen (Tabelle 7-17, ~30 Einträge),
  Kraftfelder (Tabelle 7-18), Technische/Magische/Hybride Gegenstände,
  Fahrzeuge, „Andere Erwerbungen" (Kapitel 7, S. 213-236) nicht extrahiert.
- **Kampfmechanik**: Kampfmodifikationen (Deckung/Flankieren/Tarnung),
  Fortbewegung/Größenkategorien, Sinneswahrnehmung, Besondere Fähigkeiten,
  Boni/Mali, Effekte bestimmen, Taktische Fahrzeugregeln (Kapitel 8, restliche
  Abschnitte) nicht strukturiert — Rohtext liegt in
  `extraction/kapitel8_kampfgrundlagen_raw.txt` als Nebenfund vor.
- **Zauber**: nur Zauberlisten (Name + 1-Satz-Kurzbeschreibung) erfasst, NICHT
  die vollständigen Einzel-Zauberbeschreibungen (Reichweite, Wirkungsdauer,
  Rettungswurf-SG, S. 340-386, ~46 Seiten). Technomagier-Zauberliste Grad 5
  eventuell unvollständig (Spaltenzuordnungs-Unsicherheit, siehe
  `spells.json` `_meta.technomancer_grad5_caveat`).
- **Talente**: nur Tabellen-Kurzfassung (Name/Voraussetzungen/Vorteil), nicht
  die ausführlichen Einzelbeschreibungen mit Normal-/Speziell-Abschnitten.
- **Charaktermotive** (Kapitel 2, S. 28-37) nicht extrahiert — kein Teil der
  ursprünglichen Schrittliste.
- **UI-Politur**: kein Fertigkeitsränge-Limit-Hinweis bei Überschreiten, kein
  Speichern mehrerer Waffen gleichzeitig im Kampf-Tab (nur Ad-hoc-Rechner),
  keine Talent-Auswahl-UI (Talente werden bisher nirgends im Charakterbogen
  ausgewählt/angezeigt — `feats.json` existiert, ist aber noch nicht in einen
  Tab eingebaut). Toter Pathfinder-Code (`ConditionsPanel.jsx` u.a., s.o.)
  noch nicht aufgeräumt. PWA-Icons noch die alten Pathfinder-Platzhalter.

## Offene Fragen (für die nächste Session, nicht vorentschieden)
- Gibt es eine deutsche Starfinder-SRD-Website analog zu `prd.5footstep.de`
  für Verweislinks? Noch nicht geprüft.
- Homebrew-Kategorien (aktuell aus Pathfinder übernommen: classes/races/
  weapons/armor/shields) — passen die 1:1 für Starfinder oder fehlt was
  (z.B. Augmentierungen/Cyberware als eigene Homebrew-Kategorie)?

## GitHub / Deploy
- GitHub-Repo existiert bereits: `git@github.com-private:markus-froehlich/sf1-bogen.git`
  (privater SSH-Alias, siehe AGENTS.md). Alle Commits dieser Session sind
  lokal, **noch nicht gepusht** (kein Push ohne explizite Nutzerfreigabe).
- GitHub-Pages-Deploy via Actions (analog `pf1-bogen`) noch nicht eingerichtet.
- `.claude/launch.json` (Projekt-Root) neu angelegt für den Preview-Dev-Server
  (`npm --prefix app run dev`, Port 5173).

## Hinweise
- PDF liegt lokal im Projektordner (`Starfinder_Grundregelwerk_(PDF).pdf`,
  ~210 MB), ist gitignored, bleibt nur auf diesem Rechner.
- Alle `extraction/kapitel*_raw.txt`-Dateien sind gitignored, bleiben aber auf
  der Platte liegen — nützlich, falls eine der „Bekannten Lücken" oben später
  nachträglich extrahiert werden soll, ohne das PDF erneut aufschneiden zu
  müssen.
- **Wichtige Faustregel aus dieser Session:** bei zweispaltigem PDF-Layout
  sind Tabellen die verlässlichere Quelle für Kennzahlen (Attribute, SG,
  Boni) als Fließtext-Überschriften — `pdftotext -layout` kann Text aus der
  falschen Spalte an eine Überschrift der Nachbarspalte anhängen (gefunden
  bei Fertigkeiten-Kapitel, Athletik-Überschrift).
