// Quelle: SF1e-Regelwerk, Kapitel 7, "Ausrüstung" (S. 166-167).

// S. 167: Typische Ortschaft = Gegenstandsstufe bis Charakterstufe+1,
// bedeutende Ortschaft = Charakterstufe+2 maximal verfügbar/erwerbbar.
export function maxAvailableItemLevel(characterLevel, settlementType = 'typisch') {
  return characterLevel + (settlementType === 'bedeutend' ? 2 : 1);
}

// S. 166: Ausrüstung verkaufen = 10% des Handelspreises, Handelsgüter 100%.
export function sellPrice(marketPrice, { isTradeGood = false } = {}) {
  return isTradeGood ? marketPrice : Math.floor(marketPrice * 0.1);
}

// S. 167: Tragkapazität. Last-Kategorien: Zahl, 'L' (Leicht, 10 = 1 Last)
// oder '-' (vernachlässigbar).
export function loadValueToNumber(load) {
  if (load === '-' || load === null || load === undefined) return 0;
  if (load === 'L') return 0.1; // 10 leichte Gegenstände = 1 Last
  return Number(load);
}

export function totalLoad(items) {
  return items.reduce((sum, item) => sum + loadValueToNumber(item.last) * (item.quantity ?? 1), 0);
}

// S. 167: bis 1/2 ST unbelastet, bis ST Beladen, darüber (nur unfreiwillig) Überladen.
export function encumbranceStatus(load, strengthScore) {
  if (load <= strengthScore / 2) return 'normal';
  if (load <= strengthScore) return 'beladen';
  return 'ueberladen';
}
