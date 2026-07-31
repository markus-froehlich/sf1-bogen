// Verbindet die im Homebrew-Panel angelegten Inhalte mit dem Rechenkern.
// Ohne diese Registrierung landen selbst erstellte Klassen/Völker/Waffen/
// Rüstungen nur in der Karteikarten-Verwaltung, tauchen aber nirgends in
// Dropdowns auf und fließen in keine Berechnung ein.
//
// Schilde gibt es in SF1e (anders als in Pathfinder 1e) nicht als eigene
// RK-Quelle - dafür also bewusst keine Registrierung, um keine erfundene
// Regel einzuführen.

function babForLevel(level, babType) {
  if (babType === 'full') return level
  if (babType === 'half') return Math.floor(level * 0.5)
  return Math.floor(level * 0.75) // '3/4'
}

function saveForLevel(level, isGood) {
  return isGood ? 2 + Math.floor(level / 2) : Math.floor(level / 3)
}

// Kapitel 4 (S. 56-129): alle 7 Kernklassen folgen genau zwei GAB-Mustern
// (voll = Stufe, 3/4 = Stufe×0,75 abgerundet) und einem Gut/Schlecht-Muster
// je Rettungswurf (gut erreicht 12 bei Stufe 20, schlecht 6 bei Stufe 20) -
// numerisch gegen alle 7 classes.json-Tabellen verifiziert. Das Regelwerk
// beschreibt selbst keine Homebrew-Klassenerschaffung; diese Formel ist aus
// den bestehenden Tabellen abgeleitet, kein Buchzitat - für eigene Klassen
// aber ausreichend, um eine stimmige 20-Stufen-Progression zu erzeugen statt
// den Nutzer 20 Zeilen von Hand eintragen zu lassen.
export function generateClassProgression({ bab_type, good_saves = [] }) {
  const levels = []
  for (let level = 1; level <= 20; level++) {
    levels.push({
      level,
      bab: babForLevel(level, bab_type),
      save_ref: saveForLevel(level, good_saves.includes('ref')),
      save_will: saveForLevel(level, good_saves.includes('will')),
      save_zah: saveForLevel(level, good_saves.includes('zah')),
      features: [],
    })
  }
  return levels
}

let hbRaces = []
let hbClasses = []
let hbWeapons = []
let hbArmor = []

export function registerHomebrew(hb) {
  hbRaces = hb?.races ?? []
  hbClasses = (hb?.classes ?? []).map(c => ({
    ...c,
    levels: generateClassProgression(c),
    features: [],
    is_homebrew: true,
  }))
  hbWeapons = hb?.weapons ?? []
  hbArmor = hb?.armor ?? []
}

export function getHBRaces() { return hbRaces }
export function getHBClasses() { return hbClasses }
export function getHBWeapons() { return hbWeapons }
export function getHBArmor() { return hbArmor }
