# STATUS

_Stand: 2026-07-09_

## Wo wir stehen
**Bogen inhaltlich und funktional vollständig für den in AGENTS.md
definierten Kernumfang** (alles außer Raumschiffe, Kapitel 9, das bewusst
zurückgestellt bleibt). Volk wählen → Klasse wählen → Attribute eintragen →
TP/AP/RP, EAC/KAC, Fertigkeiten, Angriffsbonus, Zauberliste, Talente und
Buffs werden korrekt live berechnet. Alle Datenkapitel des Regelwerks sind
extrahiert (inkl. Klassen-Unterwahllisten, volle Zauber- und Talent-
beschreibungen, Charaktermotive, restliche Kampfmechanik, restliche
Ausrüstung), alle UI-Komfort-Funktionen sind gebaut, und die 6 in einem
Live-Audit gegen `pf1-bogen` gefundenen Layout-Abweichungen (App-Menü,
aktiver Tab, Charakterliste, Zauber-Nachschlagen, Notizen-Moden) sind
behoben — siehe „Struktur-/Layout-Unterschiede zu pf1-bogen" unten.
Der aktuelle Stand ist gepusht und via GitHub Pages live unter
`https://markus-froehlich.github.io/sf1-bogen/`.

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
Bottom-Nav-Tabs (8, wie pf1-bogen): Charakter/Kampf/Fertigkeiten/Ausrüstung/
Zauber/Raumschiff/Notizen. Charakter- UND Kampf-Tab sind beide datengetrieben
gerendert (HEADINGS/BODIES-Maps), jeder Abschnitt mit unabhängigem Klapp-Pfeil
(▶/▼) UND Verschiebe-Pfeilen (↑/↓) — Reihenfolge/Collapse-Zustand in
localStorage (`sf1_attr_order`/`sf1_attr_collapsed` bzw. `sf1_combat_order`/
`sf1_combat_collapsed`).
- **Charakter** (`CharacterTab.jsx`): Volk&Klasse, **Erfahrung**
  (`XpTracker.jsx` — SF1es eigene Tabelle 2-4, einzelne EP-Progression
  1-20), Bio (`BioSection.jsx`), Attribute (inkl. Buff-/Zustands-Badge, siehe
  unten), **Talente** (`FeatsTab.jsx` — Budget-Anzeige nach Tabelle 2-4,
  Autocomplete-Suche, volle Beschreibung aus `feats_full.json`),
  Volks-/Klassenmerkmale.
- **Kampf** (`CombatTab.jsx`): TP/AP/RP, Kampfwerte (GAB/Rettungswürfe),
  EAC/KAC, Angriffsrechner, 35-Zustände-Toggle-Liste, **Buffs**
  (`BuffTracker.jsx` — Liste mit Ein/Aus-Toggle ohne Löschen + Formular für
  12 Bonusfelder), **Ressourcen** (`ResourcesPanel.jsx` — generischer
  Verbrauchsressourcen-Tracker, ohne PF1e-Klassenformeln). Buffs UND
  Zustände fließen über `engine/buffs.js`/`engine/conditions.js` in
  Attribute/EAC/KAC/Angriffsbonus/Rettungswürfe ein, sichtbar als ✦-Badge
  (`StatTag.jsx`) überall dort, wo etwas eingerechnet ist.
- **Fertigkeiten** (`SkillsTab.jsx`, eigener Tab seit 2026-07-09, vorher
  Abschnitt im Charakter-Tab): volle Fertigkeitsliste mit Rängen-Eingabe,
  Klassenfertigkeits-Markierung, IN-Mod-Hinweis zur Rang-Formel.
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

**Aufgeräumt (2026-07-07/08):** ursprünglich aus pf1-bogen kopierte
`ConditionsPanel.jsx`, `InventoryTab.jsx` sowie die damaligen (Pathfinder-
geprägten) `ResourcesPanel.jsx`/`XpTracker.jsx` gelöscht — komplett
Pathfinder-spezifisch/falsch für SF1e. `BioSection.jsx` war
spielsystem-neutral und wurde stattdessen eingebaut statt gelöscht.
**`ResourcesPanel.jsx`/`XpTracker.jsx` gibt es seit 2026-07-09 wieder** —
diesmal als eigenständige SF1e-Neubauten (eigene EP-Tabelle bzw.
generischer Ressourcen-Tracker ohne PF1e-Klassenformeln), nicht die alten
Dateien.

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
- **Deutsche SF1e-SRD-Website** analog `prd.5footstep.de` für
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

## Struktur-/Layout-Unterschiede zu pf1-bogen (Browser-Audit der Live-Seite, 2026-07-08)
Durchgeklickt auf `https://markus-froehlich.github.io/sf1-bogen/` (Desktop-
Breite) und mit pf1-bogen verglichen. 6 konkrete Abweichungen gefunden —
**alle 6 sind jetzt behoben** (Commit `e68251e`, 2026-07-09):

1. ✅ **⚙-Menü** war eine horizontale Button-Reihe, ist jetzt ein
   **vertikales Dropdown-Panel** (`.app-menu-wrap`/`.app-menu`/`.app-menu-item`
   — diese CSS-Klassen lagen bereits fertig aus dem pf1-bogen-Chassis vor,
   `App.jsx` nutzte nur noch nicht die passende Markup-Struktur).
2. ✅ **Menü schließt jetzt automatisch** bei Klick daneben (`.app-menu-backdrop`,
   volle Overlay-Fläche, `onClick` schließt).
3. ✅ **Aktiver Tab klar erkennbar**: Akzent-Balken oben am Button, Hintergrund-
   Tint, Icon farbig (inaktive Icons per `grayscale()`-Filter entsättigt, da
   Emoji-Glyphen `color:` ignorieren — das war der eigentliche Grund für die
   „kaum erkennbar"-Beobachtung).
4. ✅ **Charakterliste zeigt jetzt Volk/Klasse/Stufe** — `raceMap`/`classMap`
   aus `races.json`/`classes.json` in `App.jsx` gebaut und an
   `CharacterDrawer` durchgereicht (Komponente selbst brauchte keine Änderung,
   war schon 1:1 aus pf1-bogen kopiert).
5. ✅ **Zauber-Nachschlagen-Modus ergänzt** (🔍 Nachschlagen / 📖 Zauberbuch),
   durchsucht alle 183 Zauber aus `spell_descriptions.json` unabhängig von
   Klasse/eigenem Zauberbuch, mit Gradauswahl + Namenssuche.
6. ✅ **Notizen-Moden-Umschalter ergänzt** (Notizen/Kontakte/Sonderfähigkeiten,
   horizontal scrollbare Button-Reihe, neue `NotesTab.jsx`) — nutzt die schon
   vorhandenen, bis dahin unbenutzten `setContacts`/`setSpecials` aus dem
   Store. „Gifte"/„Schablonen" aus pf1-bogen bewusst nicht übernommen, da kein
   sauberes SF1e-Äquivalent (Gifte sind in `equipment_extras.json`
   bereits als Ausrüstungsposten erfasst, keine eigene Verwaltungslogik nötig).

## Pf1-bogen-Parität + Buff-/Zustands-Badges (Session 2026-07-09, Runde 2)
Nutzer-Vorgabe: „Der Pf1 ist schon weiter entwickelt und ich mag die sehr
ähnlich haben vom feeling und vom UI." Live-Vergleich gegen `pf1-bogen`
durchgeführt, alle gefundenen Punkte umgesetzt:
- **Gist-Sync wie pf1-bogen**: die 4 Sync-`useEffect`s (Auto-Restore bei
  leerem localStorage, Pull-vor-Push-Freigabe via `pushReadyRef`, debounced
  Auto-Push bei jeder Änderung, 20s-Poll + `visibilitychange`) 1:1 aus
  pf1-bogen übernommen (`sf1_`-Key-Präfixe statt `pf1_`). Nebenbei Bug
  gefixt: `GistSyncPanel` bekam hartcodiert `profile="player"` statt
  `profile={profile}` — SL-Backup zeigte fälschlich „Spieler-Backup".
- **Topbar/Menü/Bottom-Nav** komplett an pf1-bogen angeglichen: Stufe-Badge,
  Zähler-Badge auf ☰, vertikales ⚙-Menü mit SP/SL-Profil-Zeile darin (statt
  eigener Topbar-Zeile), Sync-Status-Punkt, Build-Versions-Tag, Name- und
  Spielername-Zeile getrennt. Bottom-Nav auf reine Icons ohne Label
  umgestellt, schlichte Akzentfarben-Hervorhebung (kein Grayscale-Filter/
  Akzent-Balken mehr), Einklapp-Handle + Restore-Buttons ergänzt.
- **XP-Tracker** (`XpTracker.jsx`) neu gebaut mit SF1es eigener
  Tabelle 2-4 (einzelne EP-Progression 1-20, aus Kapitel 2 Rohtext
  extrahiert — kein Schnell/Mittel/Langsam wie PF1e), als Sektion im
  Charakter-Tab reorder-/einklappbar.
- **Ressourcen-Panel** (`ResourcesPanel.jsx`) generisch nachgebaut — ohne
  die PF1e-Klassenformeln-Vorschläge (Kampfrausch/Kanalisieren/etc. passen
  nicht auf SF1e-Klassen), sonst identisches Verhalten (Max/Aktuell,
  Verbrauchen/Zurücksetzen, Alle-zurücksetzen).
- **Kampf-Tab** auf das gleiche Reorder-/Einklapp-Muster wie der
  Charakter-Tab umgestellt (▶/▼ + ↑/↓ pro Sektion, `sf1_combat_order`/
  `sf1_combat_collapsed`), Ressourcen-Panel und Buff-Tracker als Sektionen
  integriert. Klassenmerkmale bewusst NICHT als Sektion ergänzt (Nutzer:
  „die klassen merkmale lassen wir mal").

**Bugfix + neues Feature, ausgelöst durch Nutzer-Nachfrage** (Screenshot der
pf1-bogen-Live-Seite mit Buff-Badges auf Attributen): geprüft, ob Buffs
sich wirklich auf abgeleitete Werte auswirken UND ob das visuell als Badge
sichtbar ist, analog pf1-bogen.
- **Bug gefunden & gefixt**: `AttributeBlock` unterstützte das ✦-Badge
  schon strukturell, aber `CharacterTab.jsx` übergab hartcodiert `buff: 0`
  — Badge wurde nie angezeigt, obwohl der Modifikator daneben den Buff
  schon korrekt einrechnete.
- **Neu: Zustände wirken jetzt auch rechnerisch**, nicht mehr nur
  beschreibend. `data/conditions.json` hat jetzt bei 16 der 35 Zustände ein
  `mods`-Feld (nur was explizit als Zahl im Originaltext stand, nichts
  interpoliert/geraten — z.B. „Erschüttert": `{attack:-2, saveRef:-2,
  saveWill:-2, saveZah:-2}`, „Gelähmt"/„Hilflos": `{geMod:-5}` als direkter
  Eingriff in den GE-Modifikator statt in den Attributswert). Neue Engine-
  Datei `engine/conditions.js` (`computeConditionTotals`, Pendant zu
  `engine/buffs.js`), verdrahtet in `characterStats.js`: fließt in EAC/KAC,
  Angriffsbonus, alle drei Rettungswürfe und (nur GE) den Attributsmodifikator
  ein.
- **Neue geteilte Badge-Komponente** `StatTag.jsx` (✦-Badge, grün bei
  positiver, amber bei negativer Summe, Tooltip listet alle Quellen einzeln
  auf — Buffs UND Zustände gemeinsam, exakt wie im pf1-bogen-Vorbild) —
  eingebaut bei: Attributen, Reflex/Wille/Zähigkeit (Charakter-Tab),
  EAC/KAC und Angriffsbonus (Kampf-Tab). BAB bekommt bewusst kein Badge
  (nichts modifiziert BAB direkt).
- **Bewusste Umfangsgrenze**: nur Werte, die die Engine bereits aggregiert
  (Angriff/EAC/KAC/Rettungswürfe/GE-Mod) haben Zahlen-Mods bekommen.
  Bewegungsrate, Fertigkeitswürfe (pauschal), Initiative und alle rein
  verhaltensbeschreibenden Effekte („keine Aktionen möglich" etc.) bleiben
  bewusst nur Fließtext — dafür gibt's keinen passenden Rechenkern-Hook,
  und Raten wäre hier Regel-Erfindung statt Extraktion. Betroffene
  19 Zustände ohne `mods`-Feld sind in `conditions.json` einfach ohne das
  Feld gelassen (kein Platzhalter, kein `mods: {}`).
- **Verhalten bei Zustands-Verkettung** (z.B. „Betäubt" verweist nur auf
  „ist auf dem Falschen Fuß" ohne eigene Zahl zu wiederholen): bewusst NICHT
  automatisch verkettet — nur Zahlen, die im eigenen Beschreibungstext des
  jeweiligen Zustands stehen, fließen ein. Verkettung hätte Doppelzählung
  riskiert, falls der Nutzer den referenzierten Zustand zusätzlich manuell
  aktiviert.

## Offene Fragen (für die nächste Session, nicht vorentschieden)
- Gibt es eine deutsche SF1e-SRD-Website analog zu `prd.5footstep.de`?
- Homebrew-Kategorien — passen die 1:1 für SF1e oder fehlt was?
- Sollen die in „Bekannte Lücken" genannten kleineren Extraktionslücken
  (Agent Stufe 20, Solarier Stufe 14, Technomagier 17/20, Größenkategorien-
  Tabelle, erster Zauber vor „Ausbessern") gezielt nachrecherchiert werden,
  oder ist der aktuelle Stand für den Spielbetrieb ausreichend?

## GitHub / Deploy
- GitHub-Repo existiert bereits: `git@github.com-private:markus-froehlich/sf1-bogen.git`
  (privater SSH-Alias, siehe AGENTS.md).
- **Gepusht** bis Commit `144f52c` (2026-07-09) — pf1-bogen-Paritäts-Arbeit +
  Buff-/Zustands-Badges (siehe oben) sind live. Seit dieser Session gilt
  „Commit & Push — automatisch, ohne Rückfrage" (siehe AGENTS.md) für dieses
  Repo: neue Arbeit wird nach Test/Build-Check selbstständig committet und
  gepusht, ohne dass hier extra vermerkt werden muss, ob eine Freigabe schon
  vorlag.
- GitHub-Pages-Deploy via Actions (`.github/workflows/deploy.yml`, aus
  pf1-bogen-Chassis übernommen) läuft automatisch bei Push auf `main`.
  Live-URL: `https://markus-froehlich.github.io/sf1-bogen/`. Falls die
  Seite nach einem Push nicht aktualisiert: in den Repo-Einstellungen
  prüfen, ob unter Settings → Pages → Source „GitHub Actions" gewählt ist.
- `.claude/launch.json` (Projekt-Root) für den Preview-Dev-Server vorhanden
  (`npm --prefix app run dev`, Port 5173).

## Hinweise
- PDF liegt lokal im Projektordner (`SF1e_Regelwerk_(PDF).pdf`,
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
