// Aggregiert Rassen-/Klassendaten + Attribute eines Charakters zu den
// abgeleiteten SF1e-Kennwerten (Modifikatoren, TP/AP/RP, EAC/KAC, BAB,
// Rettungswürfe). Zentrale Stelle, damit CharacterTab/CombatTab/GearTab nicht
// jeweils eigene Kopien der Berechnung pflegen.

import racesData from '../data/races.json'
import classesData from '../data/classes.json'
import armorData from '../data/armor.json'
import conditionsData from '../data/conditions.json'
import { abilityModifier } from './attributes.js'
import { totalHitPoints, totalStaminaPoints, totalResolvePoints } from './resources.js'
import { armorClass } from './combat.js'
import { computeBuffTotals } from './buffs.js'
import { computeConditionTotals } from './conditions.js'

export const ABILITY_KEYS = ['ST', 'GE', 'KO', 'IN', 'WE', 'CH']

// Zuordnung Attribut → das dazugehörige "effektiver Modifikator"-Feld in
// conditions.json (z.B. Gelähmt/Hilflos: "Effektiver GE-Modifikator -5").
const ABILITY_MOD_FIELD = { ST: 'stMod', GE: 'geMod', KO: 'koMod', IN: 'inMod', WE: 'weMod', CH: 'chMod' }

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

  const { totals: buffTotals, sources: buffSources } = computeBuffTotals(char.active_buffs)
  const { totals: condTotals, sources: condSources } = computeConditionTotals(char.conditions, conditionsData.conditions)

  const abilityMods = {}
  for (const k of ABILITY_KEYS) {
    abilityMods[k] = abilityModifier((Number(char.attributes?.[k]) || 10) + buffTotals[k])
  }
  // "Effektiver X-Modifikator -Y" (z.B. Gelähmt/Hilflos: GE -5) wirkt direkt
  // auf den fertigen Modifikator, nicht auf den Attributswert - siehe
  // conditions.json. Aktuell nutzt nur GE dieses Muster in den Zustandsdaten,
  // die anderen fünf Felder sind Engine-seitig vorbereitet (gleiches Muster),
  // falls ein Zustand mal ST/KO/IN/WE/CH direkt mindert.
  for (const k of ABILITY_KEYS) {
    abilityMods[k] += condTotals[ABILITY_MOD_FIELD[k]]
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
    otherModifiers: buffTotals.eac + condTotals.eac,
  })
  const kac = armorClass({
    armorBonus: armor?.krk_bonus || 0,
    dexModifier: abilityMods.GE,
    maxDexBonus: armor?.max_ge_bonus ?? null,
    otherModifiers: buffTotals.kac + condTotals.kac,
  })

  // Buff- und Zustands-Quellen getrennt je Wert, damit die UI sie als zwei
  // optisch unterscheidbare Badges anzeigen kann (✦ Buff / ⚡ Zustand) statt
  // einer einzigen vermischten Liste.
  const TAG_FIELDS = ['eac', 'kac', 'attack', 'damage', 'saveRef', 'saveWill', 'saveZah', 'skills', 'perception']
  const buffTags = Object.fromEntries(TAG_FIELDS.map(f => [f, buffSources[f] ?? []]))
  const condTags = Object.fromEntries(TAG_FIELDS.map(f => [f, condSources[f] ?? []]))
  for (const k of ABILITY_KEYS) {
    const modField = ABILITY_MOD_FIELD[k]
    buffTags[k] = buffSources[k] ?? []
    condTags[k] = condTotals[modField] !== 0
      ? condSources[modField].map(s => ({ name: `${s.name} (Mod)`, value: s.value }))
      : []
  }

  return {
    race, klass, level, classEntry,
    abilityMods, keyAbilityModifier,
    levelRow,
    tp, ap, rp,
    armor, eac, kac,
    bab: levelRow?.bab ?? 0,
    saveRef: (levelRow?.save_ref ?? 0) + buffTotals.saveRef + condTotals.saveRef,
    saveWill: (levelRow?.save_will ?? 0) + buffTotals.saveWill + condTotals.saveWill,
    saveZah: (levelRow?.save_zah ?? 0) + buffTotals.saveZah + condTotals.saveZah,
    classAbbr: CLASS_ABBR[classEntry.id] || null,
    buffTotals: {
      ...buffTotals,
      attack: buffTotals.attack + condTotals.attack,
      damage: buffTotals.damage + condTotals.damage,
      skills: buffTotals.skills + condTotals.skills,
      perception: buffTotals.perception + condTotals.perception,
    },
    buffTags,
    condTags,
  }
}
