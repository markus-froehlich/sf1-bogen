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
import { getHBRaces, getHBClasses, getHBArmor } from './homebrew.js'
import { computeGroundSpeed } from './movement.js'

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
  if (!raceId) return null
  return racesData.races.find(r => r.id === raceId) || getHBRaces().find(r => r.id === raceId) || null
}

export function getClass(classId) {
  if (!classId) return null
  return classesData.classes.find(c => c.id === classId) || getHBClasses().find(c => c.id === classId) || null
}

export function getArmor(armorId) {
  if (!armorId) return null
  return allArmor().find(a => a.name === armorId) || null
}

export function allArmor() {
  return [
    ...armorData.light_armor.map(a => ({ ...a, category: 'light' })),
    ...armorData.heavy_armor.map(a => ({ ...a, category: 'heavy' })),
    ...armorData.power_armor.map(a => ({ ...a, category: 'power' })),
    ...getHBArmor().map(a => ({ ...a, category: a.category || 'light', is_homebrew: true })),
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
  const classEntries = (char.meta?.classes?.length ? char.meta.classes : [{ id: '', level: 1 }])
  const classEntry = classEntries[0] || { id: '', level: 1 }
  const klass = getClass(classEntry.id)
  // Charakterstufe = Summe der Stufen aller Klassen (Multiclassing, Kapitel 2
  // "Stufen in mehreren Klassen", S. 27): jede Klasse trägt GAB/Rettungswürfe/
  // TP/AP gemäß ihrer EIGENEN Stufe bei, nicht der Gesamtstufe - siehe unten
  // "classContribs". `level` bleibt hier die Gesamtcharakterstufe.
  const classContribs = classEntries
    .filter(e => e.id)
    .map(e => ({ klass: getClass(e.id), level: Math.max(1, Number(e.level) || 1) }))
    .filter(c => c.klass)
  const level = classContribs.length > 0
    ? classContribs.reduce((sum, c) => sum + c.level, 0)
    : Math.max(1, Number(classEntry.level) || 1)

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

  // Multiclassing (Kapitel 2, S. 27): jede Klasse trägt GAB/Rettungswürfe/TP/AP
  // gemäß IHRER EIGENEN Stufe bei (nicht der Gesamtcharakterstufe) und wird
  // aufaddiert - Beispiel im Regelwerk: "Soldat 5/Technomagier 1" addiert die
  // Werte der 5. Stufe als Soldat auf die der 1. Stufe als Technomagier.
  // Reservepunkte nutzen weiterhin die Gesamtcharakterstufe (halbe Stufe,
  // S. 23) + Schlüsselattributsmodifikator der ERSTEN (primären) Klasse -
  // das Regelwerk regelt RP bei Multiclassing nicht explizit anders, daher
  // hier als Vereinfachung dokumentiert statt geraten.
  const levelRow = findLevelRow(klass, level)
  const keyAbilityModifier = resolveKeyAbilityModifier(klass, abilityMods)
  const isMulticlass = classContribs.length > 1

  let tp, ap, bab, saveRefBase, saveWillBase, saveZahBase

  if (isMulticlass) {
    tp = race?.hp_bonus || 0
    ap = 0
    bab = 0
    saveRefBase = 0
    saveWillBase = 0
    saveZahBase = 0
    for (const c of classContribs) {
      const row = findLevelRow(c.klass, c.level)
      tp += totalHitPoints({ raceHpBonus: 0, classHpPerLevel: c.klass?.hp_per_level || 0, level: c.level })
      ap += totalStaminaPoints({ classApPerLevel: c.klass?.ap_base_per_level || 0, conModifier: abilityMods.KO, level: c.level })
      bab += row?.bab ?? 0
      saveRefBase += row?.save_ref ?? 0
      saveWillBase += row?.save_will ?? 0
      saveZahBase += row?.save_zah ?? 0
    }
  } else {
    tp = totalHitPoints({ raceHpBonus: race?.hp_bonus || 0, classHpPerLevel: klass?.hp_per_level || 0, level })
    ap = totalStaminaPoints({ classApPerLevel: klass?.ap_base_per_level || 0, conModifier: abilityMods.KO, level })
    bab = levelRow?.bab ?? 0
    saveRefBase = levelRow?.save_ref ?? 0
    saveWillBase = levelRow?.save_will ?? 0
    saveZahBase = levelRow?.save_zah ?? 0
  }

  const rp = totalResolvePoints({ level, keyAbilityModifier })

  // S. 29 (Kapitel 2): "Der Modifikator entspricht seinem Geschicklichkeits-
  // bonus plus Modifikatoren durch Talente und andere Fähigkeiten." Talent
  // "Verbesserte Initiative" (Kapitel 6): "+4 auf Initiativewürfe" - per
  // Talentname erkannt statt manuell einzutragen. Sonstige Boni/Mali laufen
  // wie bei allen anderen Werten über Buffs/Zustände, kein eigenes
  // Misc-Eingabefeld (dieses Muster gibt es sonst nirgends im Bogen).
  const hasImprovedInitiative = (char.feats ?? []).includes('Verbesserte Initiative')
  const initiativeFeatBonus = hasImprovedInitiative ? 4 : 0
  const initiative = abilityMods.GE + initiativeFeatBonus + buffTotals.initiative + condTotals.initiative

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
  const speed = computeGroundSpeed({ raceSpeedM: race?.speed_m ?? 9, armor })

  // Buff- und Zustands-Quellen getrennt je Wert, damit die UI sie als zwei
  // optisch unterscheidbare Badges anzeigen kann (✦ Buff / ⚡ Zustand) statt
  // einer einzigen vermischten Liste.
  const TAG_FIELDS = ['eac', 'kac', 'attack', 'damage', 'saveRef', 'saveWill', 'saveZah', 'skills', 'perception', 'initiative']
  const buffTags = Object.fromEntries(TAG_FIELDS.map(f => [f, buffSources[f] ?? []]))
  const condTags = Object.fromEntries(TAG_FIELDS.map(f => [f, condSources[f] ?? []]))
  for (const k of ABILITY_KEYS) {
    const modField = ABILITY_MOD_FIELD[k]
    buffTags[k] = buffSources[k] ?? []
    condTags[k] = condTotals[modField] !== 0
      ? condSources[modField].map(s => ({ name: `${s.name} (Mod)`, value: s.value }))
      : []
  }
  // EAC/KAC und Rettungswürfe hängen von einem festen Attributsmodifikator ab
  // (GE bzw. WE/KO, siehe Kapitel 8 S. 240f.). Ein Zustand/Buff, der nur über
  // "Effektiver X-Modifikator" wirkt (z.B. Gelähmt: GE -5), rechnet sich zwar
  // schon korrekt in den Zahlenwert ein (abilityMods.GE trägt die Änderung
  // bereits), taucht aber ohne diesen Merge nirgends als Badge auf. Deshalb
  // die jeweiligen Attribut-Badge-Quellen zusätzlich anhängen.
  buffTags.eac = [...buffTags.eac, ...buffTags.GE]
  buffTags.kac = [...buffTags.kac, ...buffTags.GE]
  buffTags.saveRef = [...buffTags.saveRef, ...buffTags.GE]
  buffTags.saveWill = [...buffTags.saveWill, ...buffTags.WE]
  buffTags.saveZah = [...buffTags.saveZah, ...buffTags.KO]
  buffTags.initiative = [
    ...buffTags.initiative,
    ...buffTags.GE,
    ...(initiativeFeatBonus !== 0 ? [{ name: 'Verbesserte Initiative', value: initiativeFeatBonus }] : []),
  ]
  condTags.eac = [...condTags.eac, ...condTags.GE]
  condTags.kac = [...condTags.kac, ...condTags.GE]
  condTags.saveRef = [...condTags.saveRef, ...condTags.GE]
  condTags.saveWill = [...condTags.saveWill, ...condTags.WE]
  condTags.saveZah = [...condTags.saveZah, ...condTags.KO]
  condTags.initiative = [...condTags.initiative, ...condTags.GE]

  return {
    race, klass, level, classEntry, classEntries, classContribs, isMulticlass,
    abilityMods, keyAbilityModifier,
    levelRow,
    tp, ap, rp,
    armor, eac, kac, speed, initiative, hasImprovedInitiative, initiativeFeatBonus,
    bab,
    // S. 240f.: "Addiere deinen Geschicklichkeitsmodifikator auf deine
    // Reflexwürfe" / "...Weisheitsmodifikator auf deine Willenswürfe" /
    // "...Konstitutionsmodifikator auf deine Zähigkeitswürfe" - der
    // Attributsmodifikator fehlte hier bisher komplett (nur Klassen-
    // Grundwert + Buffs/Zustände), echter Rechenfehler.
    saveRef: saveRefBase + abilityMods.GE + buffTotals.saveRef + condTotals.saveRef,
    saveWill: saveWillBase + abilityMods.WE + buffTotals.saveWill + condTotals.saveWill,
    saveZah: saveZahBase + abilityMods.KO + buffTotals.saveZah + condTotals.saveZah,
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
