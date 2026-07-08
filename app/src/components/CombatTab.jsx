import { useMemo, useState } from 'react'
import weaponsData from '../data/weapons.json'
import conditionsData from '../data/conditions.json'
import { computeCharacterStats } from '../engine/characterStats.js'
import { meleeAttackBonus, rangedAttackBonus } from '../engine/combat.js'
import { BuffTracker } from './BuffTracker.jsx'
import './CombatTab.css'

const WEAPON_CATEGORIES = [
  ['simple_melee_onehand', 'Einfache Nahkampfwaffen (einhändig)'],
  ['simple_melee_twohand', 'Einfache Nahkampfwaffen (zweihändig)'],
  ['advanced_melee_onehand', 'Fortschrittliche Nahkampfwaffen (einhändig)'],
  ['advanced_melee_twohand', 'Fortschrittliche Nahkampfwaffen (zweihändig)'],
  ['small_arms', 'Handfeuerwaffen'],
  ['long_arms', 'Langwaffen'],
  ['heavy_weapons', 'Schwere Waffen'],
  ['sniper_weapons', 'Scharfschützenwaffen'],
  ['special_weapons', 'Spezialwaffen'],
]

function allWeapons() {
  return WEAPON_CATEGORIES.flatMap(([key, label]) =>
    (weaponsData[key] || []).map(w => ({ ...w, _category: label, _isRanged: key !== 'simple_melee_onehand' && key !== 'simple_melee_twohand' && key !== 'advanced_melee_onehand' && key !== 'advanced_melee_twohand' }))
  )
}

export function CombatTab({ char, setConditions, setActiveBuffs, lang }) {
  const L = lang === 'de'
  const stats = useMemo(() => computeCharacterStats(char), [char])
  const { abilityMods, bab, eac, kac, armor, buffTotals } = stats
  const weapons = useMemo(allWeapons, [])
  const [weaponName, setWeaponName] = useState('')

  const weapon = weapons.find(w => w.name === weaponName) || null
  const activeConditions = new Set(char.conditions ?? [])

  function toggleCondition(name) {
    setConditions(prev => {
      const s = new Set(prev)
      if (s.has(name)) s.delete(name)
      else s.add(name)
      return [...s]
    })
  }

  const attackBonus = weapon
    ? (weapon._isRanged
        ? rangedAttackBonus({ baseAttackBonus: bab, dexModifier: abilityMods.GE, otherModifiers: buffTotals.attack })
        : meleeAttackBonus({ baseAttackBonus: bab, strengthModifier: abilityMods.ST, otherModifiers: buffTotals.attack }))
    : null

  return (
    <div className="section combat-tab">
      <section>
        <h3 className="section-title">{L ? 'Rüstungsklassen' : 'Armor Class'}</h3>
        <div className="sf-stat-row two">
          <div className="sf-stat-box big">
            <span className="sf-stat-value">{eac}</span>
            <span className="sf-stat-label">EAC</span>
          </div>
          <div className="sf-stat-box big">
            <span className="sf-stat-value">{kac}</span>
            <span className="sf-stat-label">KAC</span>
          </div>
        </div>
        <p className="char-hint">
          {armor ? `${L ? 'Angelegt' : 'Worn'}: ${armor.name} (ERK +${armor.erk_bonus}, KRK +${armor.krk_bonus}${armor.max_ge_bonus != null ? `, max. GE-Bonus +${armor.max_ge_bonus}` : ''})`
                 : (L ? 'Keine Rüstung angelegt (in Tab „Ausrüstung" ausrüsten).' : 'No armor worn (equip in "Gear" tab).')}
        </p>
      </section>

      <section>
        <h3 className="section-title">{L ? 'Angriffsrechner' : 'Attack calculator'}</h3>
        <select className="bio-select" value={weaponName} onChange={e => setWeaponName(e.target.value)}>
          <option value="">{L ? '— Waffe wählen —' : '— choose weapon —'}</option>
          {WEAPON_CATEGORIES.map(([key, label]) => (
            <optgroup key={key} label={label}>
              {(weaponsData[key] || []).map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
            </optgroup>
          ))}
        </select>
        {weapon && (
          <div className="combat-weapon-card">
            <div className="cwc-row"><span>{L ? 'Angriffsbonus' : 'Attack bonus'}</span><strong>{attackBonus >= 0 ? `+${attackBonus}` : attackBonus}</strong></div>
            <div className="cwc-row"><span>{L ? 'Schaden' : 'Damage'}</span><strong>{weapon.schaden || '—'}</strong></div>
            {weapon.kritisch && <div className="cwc-row"><span>{L ? 'Kritisch' : 'Critical'}</span><strong>{weapon.kritisch}</strong></div>}
            {weapon.reichweite && <div className="cwc-row"><span>{L ? 'Reichweite' : 'Range'}</span><strong>{weapon.reichweite}</strong></div>}
            {weapon.sondereigenschaften && <p className="char-hint">{weapon.sondereigenschaften}</p>}
          </div>
        )}
      </section>

      <section>
        <h3 className="section-title">{L ? 'Zustände' : 'Conditions'}</h3>
        {activeConditions.size > 0 && (
          <div className="cond-active-list">
            {conditionsData.conditions.filter(c => activeConditions.has(c.name)).map(c => (
              <div key={c.name} className="cond-effect-row">
                <span className="cond-effect-name">{c.name}</span>
                <span className="cond-effect-text">{c.description}</span>
              </div>
            ))}
          </div>
        )}
        <div className="cond-grid">
          {conditionsData.conditions.map(c => (
            <button
              key={c.name}
              className={`cond-chip ${activeConditions.has(c.name) ? 'active' : ''}`}
              onClick={() => toggleCondition(c.name)}
              title={c.description}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      <BuffTracker char={char} setActiveBuffs={setActiveBuffs} lang={lang} />
    </div>
  )
}
