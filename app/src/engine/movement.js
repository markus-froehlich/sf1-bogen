// Quelle: SF1e-Regelwerk, Kapitel 2 "Bewegungsrate" (S. 29) und Kapitel 7
// "Rüstungstabellen verstehen" (S. 196f., Spalte "Bewegungsrateanpassung").
//
// Anders als Pathfinder 1e (dort: pauschal nur Mittlere/Schwere Rüstung
// senkt die Bewegung um einen festen Wert) hat SF1e den Wert PRO
// Rüstungsmodell einzeln in der Tabelle stehen - manche Schwere Rüstungen
// haben gar keine Anpassung ("—"), andere -1,50 m oder -3 m. Alle 42
// Leichten Rüstungen zeigen im Rohtext durchgehend "—" (kein Effekt),
// verifiziert gegen Tabelle 7-14. Pathfinders pauschale Formel wurde daher
// NICHT übernommen, sondern durch die tatsächlichen Tabellenwerte ersetzt.

export function parseMetersValue(raw) {
  if (raw == null) return 0
  if (typeof raw === 'number') return raw
  const cleaned = raw.replace('m', '').replace(',', '.').trim()
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}

// S. 213: In einer Servorüstung nutzt man nicht die eigene Bewegungsrate,
// sondern die der Servorüstung selbst (absoluter Wert, keine Anpassung).
export function computeGroundSpeed({ raceSpeedM = 9, armor = null }) {
  if (!armor) return raceSpeedM
  if (armor.category === 'power') return parseMetersValue(armor.bewegungsrate)
  return raceSpeedM + parseMetersValue(armor.bewegungsrateanpassung)
}
