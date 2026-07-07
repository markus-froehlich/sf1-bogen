// Aggregiert Rassen-/Klassendaten + Attribute eines Charakters zu den
// abgeleiteten Starfinder-Kennwerten (Modifikatoren, TP/AP/RP, EAC/KAC, BAB,
// Rettungswürfe). Zentrale Stelle, damit CharacterTab/CombatTab/GearTab nicht
// jeweils eigene Kopien der Berechnung pflegen.

import racesData from '../data/races.json'
import classesData from '../data/classes.json'
import armorData from '../data/armor.json'
import { abilityModifier } from './attributes.js'
import { totalHitPoints, totalStaminaPoints, totalResolvePoints } from './resources.js'
import { armorClass } from './combat.js'

export const ABILITY_KEYS = ['ST', 'GE', 'KO', 'IN', 'WE', 'CH']

// Klassen-ID → Kürzel aus Tabelle 5-1 / skills.json class_skill_for
export const CLASS_ABBR = {
  agent: 'AGE',
  aspirant: 'ASP',
  gesandter: 'GES',
  mechaniker: 'MEC',
  solarier: 'SOL',
  soldat: 'SLD',
  technomagier: 'TEC',
}

export function getRace(raceId) {
  return racesData.races.find(r => r.id === raceId) || null
}

export function getClass(classId) {
  return classesData.classes.find(c => c.id === classId) || null
}

export function getArmor(armorId) {
  if (!armorId) return null
  const all = [
    ...armorData.light_armor.map(a => ({ ...a, category: 'light' })),
    ...armorData.heavy_armor.map(a => ({ ...a, category: 'heavy' })),
    ...armorData.power_armor.map(a => ({ ...a, category: 'power' })),
  ]
  return all.find(a => a.name === armorId) || null
}

export function allArmor() {
  return [
    ...armorData.light_armor.map(a => ({ ...a, category: 'light' })),
    ...armorData.heavy_armor.map(a => ({ ...a, category: 'heavy' })),
    ...armorData.power_armor.map(a => ({ ...a, category: 'power' })),
  ]
}

// Klassen mit "ST oder GE" Schlüsselattribut (Soldat) - fällt auf den
// höheren Modifikator zurück, sofern der Charakter keine explizite Wahl hat.
function resolveKeyAbilityModifier(klass, abilityMods) {
  if (!klass) return 0
  const key = klass.key_ability || ''
  const candidates = ABILITY_KEYS.filter(k => key.includes(k))
  if (candidates.length === 0) return 0
  return Math.max(...candidates.map(k => abilityMods[k] ?? 0))
}

export function findLevelRow(klass, level) {
  if (!klass?.levels) return null
  return klass.levels.find(l => l.level === level) || klass.levels[klass.levels.length - 1] || null
}

export function computeCharacterStats(char) {
  const race = getRace(char.meta?.race)
  const classEntry = char.meta?.classes?.[0] || { id: '', level: 1 }
  const klass = getClass(classEntry.id)
  const level = Math.max(1, Number(classEntry.level) || 1)

  const abilityMods = {}
  for (const k of ABILITY_KEYS) {
    abilityMods[k] = abilityModifier(Number(char.attributes?.[k]) || 10)
  }

  const levelRow = findLevelRow(klass, level)
  const keyAbilityModifier = resolveKeyAbilityModifier(klass, abilityMods)

  const tp = totalHitPoints({
    raceHpBonus: race?.hp_bonus || 0,
    classHpPerLevel: klass?.hp_per_level || 0,
    level,
  })
  const ap = totalStaminaPoints({
    classApPerLevel: klass?.ap_base_per_level || 0,
    conModifier: abilityMods.KO,
    level,
  })
  const rp = totalResolvePoints({ level, keyAbilityModifier })

  const armor = getArmor(char.equipped?.armor_id)
  const eac = armorClass({
    armorBonus: armor?.erk_bonus || 0,
    dexModifier: abilityMods.GE,
    maxDexBonus: armor?.max_ge_bonus ?? null,
  })
  const kac = armorClass({
    armorBonus: armor?.krk_bonus || 0,
    dexModifier: abilityMods.GE,
    maxDexBonus: armor?.max_ge_bonus ?? null,
  })

  return {
    race, klass, level, classEntry,
    abilityMods, keyAbilityModifier,
    levelRow,
    tp, ap, rp,
    armor, eac, kac,
    bab: levelRow?.bab ?? 0,
    saveRef: levelRow?.save_ref ?? 0,
    saveWill: levelRow?.save_will ?? 0,
    saveZah: levelRow?.save_zah ?? 0,
    classAbbr: CLASS_ABBR[classEntry.id] || null,
  }
}
