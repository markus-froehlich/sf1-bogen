// Quelle: SF1e-Regelwerk, Kapitel 7, "Waffen verwenden" (S. 168-170) und
// Kapitel 8, "Schaden anrichten" (S. 244-245).
//
// Nahkampfwaffen addieren den Stärkemodifikator zum Schaden - einhändig
// geführt zu 1x, zweihändig geführt zu 1,5x (abgerundet). Fernkampfwaffen
// (Handfeuerwaffen/Langwaffen/schwere Waffen/Scharfschützenwaffen) addieren
// grundsätzlich KEINEN Attributsmodifikator zum Schaden, sofern keine
// Sondereigenschaft etwas anderes vorschreibt (hier nicht modelliert - z.B.
// Wurfwaffen unter "Spezialwaffen" können abweichen, im Zweifel im Buch
// nachschlagen statt zu raten).

export function meleeDamageModifier({ strengthModifier = 0, twoHanded = false, otherModifiers = 0 }) {
  const abilityPart = twoHanded ? Math.floor(strengthModifier * 1.5) : strengthModifier
  return abilityPart + otherModifiers
}

export function rangedDamageModifier({ otherModifiers = 0 }) {
  return otherModifiers
}

export function computeWeaponDamageModifier({ isMelee, isTwoHanded = false, strengthModifier = 0, otherModifiers = 0 }) {
  return isMelee
    ? meleeDamageModifier({ strengthModifier, twoHanded: isTwoHanded, otherModifiers })
    : rangedDamageModifier({ otherModifiers })
}
