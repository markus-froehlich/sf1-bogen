// Aggregiert aktive Zustände (char.conditions, Namen aus data/conditions.json)
// zu Gesamtboni/-mali, die in characterStats.js in EAC/KAC, Angriffsbonus,
// Rettungswürfe und den GE-Modifikator einfließen. Nur Zustände mit einem
// "mods"-Feld in conditions.json tragen hier etwas bei — alle anderen sind
// rein beschreibend (Aktionsbeschränkungen, Bewegung, Fertigkeitswürfe u.ä.),
// siehe conditions.json für die Begründung pro Zustand.

export const CONDITION_MOD_FIELDS = ['attack', 'eac', 'kac', 'saveRef', 'saveWill', 'saveZah', 'geMod']

export function computeConditionTotals(activeConditionNames = [], conditions = []) {
  const totals = Object.fromEntries(CONDITION_MOD_FIELDS.map(f => [f, 0]))
  const sources = Object.fromEntries(CONDITION_MOD_FIELDS.map(f => [f, []]))
  for (const name of activeConditionNames) {
    const cond = conditions.find(c => c.name === name)
    if (!cond?.mods) continue
    for (const field of CONDITION_MOD_FIELDS) {
      const value = Number(cond.mods[field]) || 0
      if (value === 0) continue
      totals[field] += value
      sources[field].push({ name, value })
    }
  }
  return { totals, sources }
}
