// Aggregiert aktive Buffs (char.active_buffs) zu Gesamtboni, die in
// characterStats.js in Attributsmodifikatoren, EAC/KAC und Rettungswürfe
// einfließen. Inaktive Buffs (active === false) zählen nicht mit, bleiben
// aber in der Liste erhalten (Toggle statt Löschen).

export const BUFF_FIELDS = ['ST', 'GE', 'KO', 'IN', 'WE', 'CH', 'attack', 'eac', 'kac', 'saveRef', 'saveWill', 'saveZah']

export function computeBuffTotals(activeBuffs = []) {
  const totals = Object.fromEntries(BUFF_FIELDS.map(f => [f, 0]))
  for (const buff of activeBuffs) {
    if (buff.active === false) continue
    for (const field of BUFF_FIELDS) {
      totals[field] += Number(buff[field]) || 0
    }
  }
  return totals
}
