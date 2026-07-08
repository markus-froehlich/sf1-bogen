# STATUS

_Stand: 2026-07-08_

## Wo wir stehen
**Charakterbogen inhaltlich und funktional vollständig für den in AGENTS.md
definierten Kernumfang** (alles außer Raumschiffe, Kapitel 9, das bewusst
zurückgestellt bleibt). Volk wählen → Klasse wählen → Attribute eintragen →
TP/AP/RP, EAC/KAC, Fertigkeiten, Angriffsbonus, Zauberliste, Talente und
Buffs werden korrekt live berechnet. Alle Datenkapitel des Regelwerks sind
extrahiert (inkl. Klassen-Unterwahllisten, volle Zauber- und Talent-
beschreibungen, Charaktermotive, restliche Kampfmechanik, restliche
Ausrüstung), und alle in der vorherigen Session-Runde offenen UI-Komfort-
Funktionen (Punkte 1-11 unten in „Erledigt seit letztem Stand") sind gebaut
und im Browser-Preview getestet.

## Entscheidungen (siehe AGENTS.md für Details)
1. **Eigener Rechenkern**, nicht in `pf1-bogen` integriert.
2. **Gleiches Grundgerüst** wie `pf1-bogen` (React/Vite/PWA, Charakterverwaltung, Gist-Backup).
3. **Raumschiffe explizit zurückgestellt** — einzige verbleibende große Lücke.
4. **PDF-Extraktion statt Excel-Extraktion** — Verifikation über Buch-eigene Rechenbeispiele und Handnachrechnung statt Excel-Referenzwerten.
5. **Große Kapitel per parallelen Sub-Agenten extrahiert** (siehe AGENTS.md „PDF-Extraktion").
6. **Unsichere Extraktions-Stellen sind explizit markiert** (`"unsicher": true` + Kommentar in den JSON-Dateien), nie stillschweigend geraten.

## Datenstand (`app/src/data/`)
| Datei | Inhalt | Quelle (Buch) |
|---|---|---|
| `races.json` | 7 Völker, Attributsmods, TP, Merkmale | Kapitel 3, S. 38-55 |
| `skills.json` | 20 Fertigkeiten | Kapitel 5, S. 130-149 |
| `classes.json` | 7 Klassen, volle 20-Stufen-Tabellen, Merkmale | Kapitel 4, S. 56-129 |
| `archetypes.json` | Archetypen-Mechanismus + 2 Beispiele | Kapitel 4, S. 126-129 |
| `class_options.json` | Klassen-Unterwahllisten: Agententricks+Spezialisierungen, Mechanikertricks+Drohnen, Kampfstile+Ausrüstungskniffe (Soldat), Gravitonen/Photonen/Zenit-Offenbarungen (Solarier), Magische Hacks (Technomagier) | Kapitel 4 |
| `motives.json` | 9 Charaktermotive + Motivlos-Sonderregel, je mit Stufenfähigkeiten 6/12/18 | Kapitel 2, S. 28-37 |
| `weapons.json` | ~350 Waffen über 13 Tabellen + Glossare | Kapitel 7, S. 168-195 |
| `armor.json` | 42 leichte + 38 schwere + 5 Servorüstungen + Rüstungsverbesserungen + Kraftfelder | Kapitel 7, S. 196-207 |
| `equipment_extras.json` | Computer-Regeln, Technische/Magische/Hybride Gegenstände, Fahrzeuge, Andere Erwerbungen | Kapitel 7, S. 213-236 |
| `equipment_rules.json` | Credits, Gegenstandsstufen-Zugang, Tragkapazität | Kapitel 7, S. 166-167 |
| `conditions.json` | 35 Zustände mit voller Beschreibung | Kapitel 8, S. 273-277 |
| `tactical_rules_extra.json` | Bewegung/Position, Sinneswahrnehmung, Besondere Fähigkeiten, Boni/Mali, Effekte definieren, Fahrzeug-/Verfolgungsjagdregeln | Kapitel 8, S. 256-287 |
| `feats.json` | 97 Talente (Kurzfassung: Name/Voraussetzungen/Vorteil) | Kapitel 6, S. 150-164 |
| `feats_full.json` | Dieselben 97 Talente mit vollem Fließtext + Normal-/Speziell-Absätzen | Kapitel 6, S. 150-164 |
| `spells.json` | Zauberregeln + Kurzlisten je Klasse/Grad (Aspirant/Technomagier) | Kapitel 10, S. 328-339 |
| `spell_descriptions.json` | 183 vollständige Zauberbeschreibungen (Statblock + Fließtext) | Kapitel 10, S. 340-386 |

Engine-Module (`app/src/engine/`): `attributes.js`, `skills.js`, `resources.js`
(TP/AP/RP), `combat.js` (EAC/KAC, Angriffswurf), `equipment.js`,
`buffs.js` (aggregiert `char.active_buffs` zu Gesamtboni), `characterStats.js`
(zentrale Aggregation aller Kennwerte inkl. Buff-Einfluss — einzige Stelle,
die alle Tabs lesen).

## UI-Stand (`app/src/components/`)
- **Charakter** (`CharacterTab.jsx`): datengetrieben gerendert (HEADINGS/BODIES-
  Maps), jeder Abschnitt mit unabhängigem Klapp-Pfeil (▶/▼) UND Verschiebe-
  Pfeilen (↑/↓) — Reihenfolge/Collapse-Zustand in localStorage
  (`sf1_char_order`, `sf1_char_collapsed`). Abschnitte: Volk&Klasse, Bio
  (`BioSection.jsx` — Kampagne/Gesinnung/Gottheit/Aussehen/Hintergrund etc.),
  Attribute, TP/AP/RP, Kampfwerte, Fertigkeiten, **Talente** (`FeatsTab.jsx`
  — Budget-Anzeige nach Tabelle 2-4, Autocomplete-Suche, volle Beschreibung
  aus `feats_full.json`), Volks-/Klassenmerkmale.
- **Kampf** (`CombatTab.jsx`): EAC/KAC live (inkl. Buff-Einfluss), Angriffs-
  rechner, 35-Zustände-Toggle-Liste, **Buffs** (`BuffTracker.jsx` — Liste mit
  Ein/Aus-Toggle ohne Löschen + Formular für 12 Bonusfelder, fließt über
  `engine/buffs.js` in Attribute/EAC/KAC/Angriffsbonus/Rettungswürfe ein).
- **Ausrüstung** (`GearTab.jsx`): Credits, Rüstung ausrüsten, Inventar.
- **Zauber** (`SpellsTab.jsx`): Zauberplätze, bekannte Zauber pro Grad.
- **Raumschiff**: weiterhin bewusster Platzhalter.
- **Notizen**: Textfeld.
- **Druckansicht** (`PrintView.jsx`, über Menü „🖨 Drucken"): weißes A4-Layout,
  `@media print` blendet App-Shell aus, zeigt alle Kennwerte + Talente +
  Merkmale + Ausrüstung + Zauber + Notizen kompakt zusammengefasst.
- **Topbar**: Schriftgrößen-Regler (−Aa+, `fs-s/l/xl`), Sprachumschaltung
  DE/EN, einklappbar, SP/SL-Profil-Umschalter (getrennte localStorage-Keys
  über `_gm`-Suffix).
- **HomebrewPanel**: Formular-Buttons auf Icon-Muster (🗑/✕/✓, 40×40px)
  umgestellt.

**Aufgeräumt:** `ConditionsPanel.jsx`, `ResourcesPanel.jsx`, `InventoryTab.jsx`,
`XpTracker.jsx` gelöscht (alle vier waren entweder komplett Pathfinder-
spezifisch/falsch für Starfinder oder redundant zu den neuen Starfinder-
eigenen Tab-Implementierungen). `BioSection.jsx` war spielsystem-neutral und
wurde stattdessen eingebaut statt gelöscht.

**Getestet (jede Session-Runde):** `npm run build` grün, im Browser-Preview
durchgeklickt (Werte gegen Formeln von Hand nachgerechnet — z.B. Vesk/
Technomagier Stufe 3: EAC 10→11 nach GE-Buff, Angriffsbonus +6→+7 nach
Angriffs-Buff, beides nach Deaktivieren zurückgesetzt), mobiles Layout bei
`fs-xl` auf 375px Breite ohne horizontalen Overflow geprüft.

## Bekannte Lücken (bewusst zurückgestellt bzw. Extraktionsgrenzen)
- **Raumschiffe (Kapitel 9)** — eigene, spätere Phase.
- **Kleinere Lücken innerhalb der Klassen-Unterwahllisten** (`class_options.json`,
  siehe dortige `notes`-Felder): Agententricks Stufe 20 nicht im Rohtext
  gefunden; Solarier Stufe 14 hat nur eine Photonen-, keine Gravitonen-
  Offenbarung gefunden; Technomagier Magische Hacks der Stufen 17/20 fehlen
  (Rohtext endet vorher); Aspirant Geistschinger/Heiler-Verbindungszauber
  Grad 6 nicht im Rohtext auffindbar.
- **Ausrüstung**: einige technische Gegenstände (Bewegungsmelder, Lasermikro-
  phon, Röntgenblickvisor, Spionagedrohne, Regenerationsbett in
  `equipment_extras.json`) ohne Preis/Stufe im Rohtext gefunden — als
  `unsicher` markiert statt geraten.
- **Kampfmechanik**: Größenkategorien-Tabelle (Winzling–Kolossal mit
  Reichweiten) wurde gesucht, aber in den extrahierten Rohtexten nicht
  gefunden (`tactical_rules_extra.json` `notes`) — müsste bei Bedarf gezielt
  nachrecherchiert werden.
- **Zauber**: `spell_descriptions.json` hat 183 vollständige Beschreibungen;
  der alphabetisch erste Zauber vor „Ausbessern" (vermutlich „Auflösung")
  beginnt vor dem extrahierten Seitenbereich und fehlt komplett.
- **PWA-Icons** noch die alten Pathfinder-Platzhalter (`public/icons/`).
- **Homebrew-Kategorien** (classes/races/weapons/armor/shields, aus
  Pathfinder übernommen) — ob Augmentierungen/Cyberware als eigene Kategorie
  sinnvoll wären, ist noch offen.
- **Deutsche Starfinder-SRD-Website** analog `prd.5footstep.de` für
  Verweislinks — noch nicht geprüft, ob es sowas gibt.

## Erledigt seit letztem Stand (diese Session-Runde, 2026-07-07/08)
Alle 13 in der vorherigen Runde aufgelisteten UI-Komfort-Funktionen sowie
alle Daten-Extraktionsaufgaben sind jetzt erledigt:
1.-3., 10. Schriftgrößen-Regler, Sprachumschaltung, Topbar-Einklappen,
   SP/SL-Profil — ✅ (Commit `b357fea`)
4.-5. Panel-Umsortierung + unabhängiges Ein-/Ausklappen im Charakter-Tab —
   ✅ (Commit `af38e56`, nutzt bereits vorhandenen `useSectionOrder`-Hook)
6. Icon-Buttons-Muster — ✅ im HomebrewPanel umgestellt (Commit `1ddf047`);
   GearTab/CombatTab nutzten das Muster bereits vorher korrekt.
7. Tote Komponenten aufgeräumt/eingebaut — ✅ (Commit `e131eba`)
8. Druckansicht — ✅ (Commit `666acbf`)
9. Buff-Tracker mit echter Rechenkern-Anbindung — ✅ (Commit `9ab60be`)
11. Talente-Auswahl-UI — ✅ (Commit `20eeaae`)
12. PWA-Icons — noch offen, siehe „Bekannte Lücken".
13. Push — noch offen, siehe unten.

Zusätzlich alle Daten-Erweiterungsaufgaben: Klassen-Unterwahllisten,
Ausrüstungslücken (Rüstungsverbesserungen/Kraftfelder/Technische-Magische-
Hybride-Gegenstände/Fahrzeuge/Andere Erwerbungen), restliche Kampfmechanik
(Kapitel 8 komplett), volle Zauberbeschreibungen (183 Zauber), volle
Talentbeschreibungen (alle 97), Charaktermotive (9+Motivlos).

## Offene Fragen (für die nächste Session, nicht vorentschieden)
- Gibt es eine deutsche Starfinder-SRD-Website analog zu `prd.5footstep.de`?
- Homebrew-Kategorien — passen die 1:1 für Starfinder oder fehlt was?
- Sollen die in „Bekannte Lücken" genannten kleineren Extraktionslücken
  (Agent Stufe 20, Solarier Stufe 14, Technomagier 17/20, Größenkategorien-
  Tabelle, erster Zauber vor „Ausbessern") gezielt nachrecherchiert werden,
  oder ist der aktuelle Stand für den Spielbetrieb ausreichend?

## GitHub / Deploy
- GitHub-Repo existiert bereits: `git@github.com-private:markus-froehlich/sf1-bogen.git`
  (privater SSH-Alias, siehe AGENTS.md).
- **Alle Commits sind weiterhin lokal, noch nicht gepusht** (kein Push ohne
  explizite Nutzerfreigabe — siehe AGENTS.md „Git / Account-Trennung").
- GitHub-Pages-Deploy via Actions noch nicht eingerichtet.
- `.claude/launch.json` (Projekt-Root) für den Preview-Dev-Server vorhanden
  (`npm --prefix app run dev`, Port 5173).

## Hinweise
- PDF liegt lokal im Projektordner (`Starfinder_Grundregelwerk_(PDF).pdf`,
  ~210 MB), gitignored.
- Alle `extraction/kapitel*_raw.txt`-Dateien sind gitignored, bleiben aber
  auf der Platte — nützlich für gezielte Nachextraktion der oben genannten
  kleineren Lücken, ohne das PDF erneut aufschneiden zu müssen. Neu in
  dieser Runde hinzugekommen: `kapitel2_charaktermotive_raw.txt`,
  `kapitel7_sonstige_ausruestung_raw.txt`, `kapitel8_rest_raw.txt`,
  `kapitel10_zauberbeschreibungen_raw.txt`.
- **Faustregel zu zweispaltigem PDF-Layout** (bestätigt sich in dieser
  Runde mehrfach): Tabellen sind verlässlicher als Fließtext-Überschriften;
  bei Statblock-Verweiszaubern („funktioniert wie X") können einzelne
  Header-Felder (Zeitaufwand/Reichweite/etc.) im Rohtext komplett fehlen,
  weil das Original nur die Delta-Felder zum Basiszauber auflistet — das
  ist keine Extraktionslücke, sondern Originaltreue.
- **Testing-Hinweis:** `window.print()` lässt sich im headless Browser-
  Preview nicht sicher auslösen — ein echter Systemdialog blockiert den
  Browser-Prozess (in dieser Runde einmal passiert, per Server-Neustart
  behoben). Bei zukünftigen PrintView-Änderungen die Vorschau visuell
  prüfen, aber den tatsächlichen `.print-go`-Button im automatisierten
  Preview nicht anklicken.
