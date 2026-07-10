// Quelle: SF1e-Regelwerk, Kapitel 5, "Fertigkeiten erlangen" und
// "Fertigkeitswürfe" (S. 132), Kapitel 2 "Schritt 7: Fertigkeitsränge und
// Talente" (S. 15).

// S. 132: Fertigkeitsränge pro Stufe = Klassenwert + IN-Modifikator,
// mindestens aber immer 1 Rang, unabhängig davon wie niedrig der
// Intelligenzmodifikator ist.
export function skillRanksForLevel(classSkillPointsPerLevel, intModifier) {
  return Math.max(1, classSkillPointsPerLevel + intModifier);
}

// S. 132, Tabelle "Art des Fertigkeitswurfes": Gesamtfertigkeitsbonus =
// Fertigkeitsränge + (Bonus für Geübte Klassenfertigkeit: +3, nur falls
// mind. 1 Rang investiert) + Schlüsselattributsmodifikator + sonstige
// Modifikatoren (u.a. Rüstungsmalus bei entsprechend markierten Fertigkeiten).
export const CLASS_SKILL_BONUS = 3;

export function computeSkillBonus({
  ranks = 0,
  isClassSkill = false,
  keyAbilityModifier = 0,
  armorCheckPenalty = 0,
  otherModifiers = 0,
}) {
  const classSkillBonus = isClassSkill && ranks > 0 ? CLASS_SKILL_BONUS : 0;
  return ranks + classSkillBonus + keyAbilityModifier + armorCheckPenalty + otherModifiers;
}

// S. 132/133: Nur-geübte Fertigkeiten (skill.untrained === false) können nur
// eingesetzt werden, wenn wenigstens 1 Fertigkeitsrang investiert wurde.
export function canUseUntrained(skill, ranks) {
  return skill.untrained || ranks > 0;
}
