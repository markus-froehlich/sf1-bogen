// Quelle: Starfinder Grundregelwerk, Kapitel 2, "Gesundheit und
// Reservepunkte" (S. 22-23). Die drei Punktevorräte: Trefferpunkte (TP),
// Ausdauerpunkte (AP), Reservepunkte (RP) - siehe AGENTS.md zur Einordnung
// als Starfinder-Kernmechanik ohne Pathfinder-Äquivalent.

// S. 22, "Trefferpunkte berechnen": Volks-TP nur einmalig mit der 1. Stufe,
// danach pro Stufe die in der Klasse festgelegte (stufenunabhängige) Anzahl.
export function totalHitPoints({ raceHpBonus, classHpPerLevel, level }) {
  return raceHpBonus + classHpPerLevel * level;
}

// S. 22, "Ausdauerpunkte berechnen": pro Stufe Klassenwert + KO-Modifikator,
// wobei diese Summe pro Stufe nie unter 0 fällt. Da sich der KO-Modifikator
// nachträglich ändern kann, wird stets mit dem aktuellen KO-Modifikator über
// alle Stufen neu gerechnet (S. 21: Änderungen am Modifikator wirken sich auf
// die AP aus).
export function totalStaminaPoints({ classApPerLevel, conModifier, level }) {
  const perLevel = Math.max(0, classApPerLevel + conModifier);
  return perLevel * level;
}

// S. 23, "Reservepunkte berechnen": halbe Charakterstufe (abgerundet, min. 1)
// + Schlüsselattributsmodifikator der Klasse, Gesamtergebnis nie unter 1.
export function totalResolvePoints({ level, keyAbilityModifier }) {
  const halfLevel = Math.max(1, Math.floor(level / 2));
  return Math.max(1, halfLevel + keyAbilityModifier);
}
