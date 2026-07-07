// Quelle: Starfinder Grundregelwerk, Kapitel 2, "Attributswerte" (S. 18-21)
// und "Stufenaufstieg und Attributswerte" (S. 21, wiederholt S. 26).

export const ABILITY_KEYS = ['ST', 'GE', 'KO', 'IN', 'WE', 'CH'];

// S. 21: "berechnest du Attributsmodifikatoren, indem du vom Attributswert 10
// abziehst, das Ergebnis halbierst und einen Bruch abrundest." Gegen Tabelle
// 2-1 (Werte 1-26) verifiziert, exakte Übereinstimmung für jeden Tabelleneintrag.
export function abilityModifier(score) {
  return Math.floor((score - 10) / 2);
}

// S. 18, Attributswerte kaufen: Start bei 10 in jedem Attribut, Volks- und
// Motivmodifikatoren addieren, danach 10 Punkte 1:1 frei verteilen. Kein
// Attributswert darf zu diesem Zeitpunkt 18 übersteigen.
export const POINT_BUY = {
  startingScore: 10,
  pointPool: 10,
  maxScoreAtLevel1: 18,
};

// S. 19, optionale Attributsschnellauswahl.
export const QUICK_ARRAYS = {
  fokussiert: [18, 14, 11, 10, 10, 10],
  aufgeteilt: [16, 16, 11, 10, 10, 10],
  vielseitig: [14, 14, 14, 11, 10, 10],
};

// S. 21/26, Stufenaufstieg und Attributswerte: Auf Stufe 5, 10, 15 und 20
// wählst du jeweils 4 verschiedene Attribute zum Steigern aus. Ist der
// aktuelle Wert >=17, steigt er um 1, sonst um 2.
export const LEVEL_BOOST_LEVELS = [5, 10, 15, 20];
export const LEVEL_BOOST_COUNT = 4;

export function abilityBoostAmount(currentScore) {
  return currentScore >= 17 ? 1 : 2;
}

// chosenKeys: Array von genau 4 verschiedenen Einträgen aus ABILITY_KEYS.
export function applyLevelBoosts(scores, chosenKeys) {
  if (chosenKeys.length !== LEVEL_BOOST_COUNT) {
    throw new Error(`Es müssen genau ${LEVEL_BOOST_COUNT} unterschiedliche Attribute gewählt werden.`);
  }
  if (new Set(chosenKeys).size !== chosenKeys.length) {
    throw new Error('Die vier gesteigerten Attribute müssen unterschiedlich sein.');
  }
  const next = { ...scores };
  for (const key of chosenKeys) {
    next[key] = scores[key] + abilityBoostAmount(scores[key]);
  }
  return next;
}
