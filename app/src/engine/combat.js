// Quelle: SF1e-Regelwerk, Kapitel 8, "Kampfgrundlagen" (S. 240-245)
// und "Verwundung und Tod" (S. 250-252).

// S. 240: RK-Grundwert 10 + Rüstungsbonus (ERK oder KRK) + GE-Modifikator
// (begrenzt durch den Maximalen GE-Bonus der getragenen Rüstung).
export function armorClass({ armorBonus = 0, dexModifier = 0, maxDexBonus = null, otherModifiers = 0 }) {
  const cappedDex = maxDexBonus == null ? dexModifier : Math.min(dexModifier, maxDexBonus);
  return 10 + armorBonus + cappedDex + otherModifiers;
}

// S. 240: ERK = Verteidigung gegen Energieschaden (Elektrizität, Feuer, Kälte,
// Säure, Schall). KRK = Verteidigung gegen Hieb-/Stich-/Wuchtschaden
// (kinetisch), außerdem Fallschaden sowie Erdrücken/Würgen/Zermalmen.
export function energyArmorClass(args) {
  return armorClass(args);
}
export function kineticArmorClass(args) {
  return armorClass(args);
}

// S. 241/242: Nahkampf = Grundangriffsbonus + Stärkemodifikator (bzw. GE bei
// Fein-Waffen, hier nicht modelliert). Fernkampf = Grundangriffsbonus +
// Geschicklichkeitsmodifikator - Entfernungsmalus. Wurfwaffen nutzen den
// Stärkemodifikator wie Nahkampfwaffen.
export function meleeAttackBonus({ baseAttackBonus, strengthModifier, otherModifiers = 0 }) {
  return baseAttackBonus + strengthModifier + otherModifiers;
}
export function rangedAttackBonus({ baseAttackBonus, dexModifier, rangeIncrementPenalty = 0, otherModifiers = 0 }) {
  return baseAttackBonus + dexModifier - Math.abs(rangeIncrementPenalty) + otherModifiers;
}

// S. 242: -2 kumulativ pro angebrochener Grundreichweiteneinheit über die
// Grundreichweite hinaus; Maximalreichweite = 10x Grundreichweite (5x bei
// Wurfwaffen).
export function rangeIncrementPenalty({ distance, rangeIncrement }) {
  const increments = Math.ceil(distance / rangeIncrement) - 1;
  return Math.max(0, increments) * 2;
}

// S. 242: Natürliche 1 = automatischer Fehlschlag, natürliche 20 = automatischer
// Treffer UND kritischer Treffer, falls der Wurf auch ohne die 20 getroffen hätte.
export function resolveAttackRoll({ naturalRoll, attackBonus, targetArmorClass }) {
  if (naturalRoll === 1) return { hit: false, critical: false };
  const total = naturalRoll + attackBonus;
  if (naturalRoll === 20) {
    return { hit: true, critical: total >= targetArmorClass };
  }
  return { hit: total >= targetArmorClass, critical: false };
}

// S. 250-252: Sterben, Stabilisieren, Tod.
export const DYING_RESOLVE_POINT_LOSS_PER_TURN = 1;
export const SELF_STABILIZE_RESOLVE_POINT_COST = 3;
export const RECOVER_ONE_HP_RESOLVE_POINT_COST = 1;

export function isDying({ hitPoints }) {
  return hitPoints <= 0;
}

// S. 251: Massiver Schaden - ein einzelner Angriff reduziert auf 0 TP UND der
// übrige Schaden ist >= dem TP-Maximum, oder ein Angriff bei bereits 0 TP
// verursacht Schaden >= TP-Maximum: sofortiger Tod.
export function isMassiveDamageDeath({ damageDealt, hitPointsBeforeDamage, maxHitPoints }) {
  if (hitPointsBeforeDamage <= 0) {
    return damageDealt >= maxHitPoints;
  }
  const overflow = damageDealt - hitPointsBeforeDamage;
  return overflow >= maxHitPoints;
}
