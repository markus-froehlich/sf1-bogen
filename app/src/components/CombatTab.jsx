import { useMemo, useState } from 'react'
import weaponsData from '../data/weapons.json'
import conditionsData from '../data/conditions.json'
import { computeCharacterStats } from '../engine/characterStats.js'
import { meleeAttackBonus, rangedAttackBonus } from '../engine/combat.js'
import { computeWeaponDamageModifier } from '../engine/weapons.js'
import { getHBWeapons } from '../engine/homebrew.js'
import { BuffTracker } from './BuffTracker.jsx'
import { ResourcesPanel } from './ResourcesPanel.jsx'
import { StatBadges } from './DetailTag.jsx'
import { NumberField } from './NumberField.jsx'
import { useSectionOrder } from '../store/useSectionOrder.js'
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

const COMBAT_SECTIONS_DEFAULT = ['tp', 'kampfwerte', 'speed', 'ac', 'attack', 'conditions', 'buffs', 'resources']

function useCollapsed(storageKey) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(storageKey) ?? '[]')) }
    catch { return new Set() }
  })
  function toggle(id) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      localStorage.setItem(storageKey, JSON.stringify([...next]))
      return next
    })
  }
  return [collapsed, toggle]
}

const MELEE_ONEHAND_KEYS = ['simple_melee_onehand', 'advanced_melee_onehand']
const MELEE_TWOHAND_KEYS = ['simple_melee_twohand', 'advanced_melee_twohand']

function allWeapons() {
  const core = WEAPON_CATEGORIES.flatMap(([key, label]) => {
    const isMelee = MELEE_ONEHAND_KEYS.includes(key) || MELEE_TWOHAND_KEYS.includes(key)
    const isTwoHanded = MELEE_TWOHAND_KEYS.includes(key)
    return (weaponsData[key] || []).map(w => ({ ...w, _category: label, _isRanged: !isMelee, _isMelee: isMelee, _isTwoHanded: isTwoHanded }))
  })
  const homebrew = getHBWeapons().map(w => ({
    ...w,
    _category: 'Homebrew',
    _isRanged: !w.is_melee,
    _isMelee: !!w.is_melee,
    _isTwoHanded: !!w.is_two_handed,
  }))
  return [...core, ...homebrew]
}

export function CombatTab({ char, update, setConditions, setActiveBuffs, setResources, lang }) {
  const L = lang === 'de'
  const stats = useMemo(() => computeCharacterStats(char), [char])
  const { abilityMods, tp, ap, rp, bab, saveRef, saveWill, saveZah, eac, kac, armor, speed, buffTotals, buffTags, condTags } = stats
  const weapons = useMemo(allWeapons, [])
  const [weaponName, setWeaponName] = useState('')

  const [order, moveSection] = useSectionOrder('sf1_combat_order', COMBAT_SECTIONS_DEFAULT)
  const [collapsed, toggleCollapsed] = useCollapsed('sf1_combat_collapsed')

  const weapon = weapons.find(w => w.name === weaponName) || null
  const activeConditions = new Set(char.conditions ?? [])
  const current = char.resources_current ?? { tp: null, ap: null, rp: null }

  function setResourceCurrent(key, value) {
    update({ resources_current: { [key]: Number(value) } })
  }
  function fillResource(key, max) {
    update({ resources_current: { [key]: max } })
  }

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
  // Angriffsbonus hängt je nach Waffe von ST (Nahkampf) oder GE (Fernkampf)
  // ab - ein Buff/Zustand, der nur diesen Attributsmodifikator ändert (z.B.
  // Gelähmt: GE -5), rechnet sich schon korrekt in attackBonus ein, taucht
  // aber ohne diesen Merge nicht als Badge auf.
  const attackAbilityKey = weapon ? (weapon._isRanged ? 'GE' : 'ST') : null
  const attackBuffSources = attackAbilityKey ? [...buffTags.attack, ...buffTags[attackAbilityKey]] : buffTags.attack
  const attackCondSources = attackAbilityKey ? [...condTags.attack, ...condTags[attackAbilityKey]] : condTags.attack
  const damageModifier = weapon
    ? computeWeaponDamageModifier({ isMelee: weapon._isMelee, isTwoHanded: weapon._isTwoHanded, strengthModifier: abilityMods.ST, otherModifiers: buffTotals.damage })
    : 0

  const HEADINGS = {
    tp: L ? 'Trefferpunkte, Ausdauer & Reserve' : 'Hit Points, Stamina & Resolve',
    kampfwerte: L ? 'Kampfwerte' : 'Combat stats',
    speed: L ? 'Bewegung' : 'Movement',
    ac: L ? 'Rüstungsklassen' : 'Armor Class',
    attack: L ? 'Angriffsrechner' : 'Attack calculator',
    conditions: L ? 'Zustände' : 'Conditions',
    buffs: L ? 'Buffs' : 'Buffs',
    resources: L ? 'Ressourcen' : 'Resources',
  }

  // Nur auf Handys werden die längsten Überschriften gekürzt (wie
  // pf1-bogen) - Tablet/Desktop zeigen weiterhin den vollen Titel.
  const PHONE_HEADINGS = {
    tp: 'TP/AP/RP',
    ac: 'EAC/KAC',
  }

  // Eingeklappte Abschnitte zeigen die Kernwerte statt einer leeren
  // Überschrift (wie pf1-bogen) - SF1e hat kein KMB/KMV, daher hier GAB +
  // Rettungswürfe zusammen (in SF1e eine gemeinsame Sektion).
  const activeBuffCount = (char.active_buffs ?? []).filter(b => b.active !== false).length
  const SUMMARIES = {
    tp: `TP ${current.tp ?? tp}/${tp} · AP ${current.ap ?? ap}/${ap} · RP ${current.rp ?? rp}/${rp}`,
    kampfwerte: `${L ? 'GAB' : 'BAB'} ${bab >= 0 ? '+' : ''}${bab} · Ref ${saveRef >= 0 ? '+' : ''}${saveRef}/Wil ${saveWill >= 0 ? '+' : ''}${saveWill}/Zäh ${saveZah >= 0 ? '+' : ''}${saveZah}`,
    speed: `${L ? 'Zu Fuß' : 'Walk'} ${speed} m`,
    ac: `EAC ${eac} · KAC ${kac}`,
    attack: weapon ? `${weapon.name}: ${attackBonus >= 0 ? '+' : ''}${attackBonus}` : '',
    conditions: activeConditions.size > 0 ? `${activeConditions.size} ${L ? 'aktiv' : 'active'}` : '',
    buffs: activeBuffCount > 0 ? `${activeBuffCount} ${L ? 'aktiv' : 'active'}` : '',
    resources: (char.resources ?? []).length > 0 ? `${(char.resources ?? []).length}` : '',
  }

  const BODIES = {
    tp: () => (
      <div className="sf-resource-row">
        <ResourceBox label="TP" full={L ? 'Trefferpunkte' : 'Hit Points'} max={tp} current={current.tp} onChange={v => setResourceCurrent('tp', v)} onFill={() => fillResource('tp', tp)} />
        <ResourceBox label="AP" full={L ? 'Ausdauerpunkte' : 'Stamina Points'} max={ap} current={current.ap} onChange={v => setResourceCurrent('ap', v)} onFill={() => fillResource('ap', ap)} />
        <ResourceBox label="RP" full={L ? 'Reservepunkte' : 'Resolve Points'} max={rp} current={current.rp} onChange={v => setResourceCurrent('rp', v)} onFill={() => fillResource('rp', rp)} />
      </div>
    ),
    kampfwerte: () => (
      <div className="sf-stat-row">
        <StatBox label={L ? 'GAB' : 'BAB'} value={bab >= 0 ? `+${bab}` : bab} />
        <StatBox label={L ? 'Reflex' : 'Reflex'} value={saveRef >= 0 ? `+${saveRef}` : saveRef} buffSources={buffTags.saveRef} condSources={condTags.saveRef} />
        <StatBox label={L ? 'Wille' : 'Will'} value={saveWill >= 0 ? `+${saveWill}` : saveWill} buffSources={buffTags.saveWill} condSources={condTags.saveWill} />
        <StatBox label={L ? 'Zähigkeit' : 'Fortitude'} value={saveZah >= 0 ? `+${saveZah}` : saveZah} buffSources={buffTags.saveZah} condSources={condTags.saveZah} />
      </div>
    ),
    speed: () => (
      <>
        <div className="sf-stat-row">
          <StatBox label={L ? 'Zu Fuß' : 'Walk'} value={`${speed} m`} />
        </div>
        <p className="char-hint">
          {armor?.category === 'power'
            ? (L ? 'Servorüstung: eigene Bewegungsrate der Rüstung statt der des Volkes.' : 'Powered armor: uses the suit\'s own speed instead of your race\'s.')
            : armor?.bewegungsrateanpassung
              ? (L ? `Rüstung passt die Bewegungsrate an (${armor.bewegungsrateanpassung}).` : `Armor adjusts movement speed (${armor.bewegungsrateanpassung}).`)
              : (L ? 'Volksbewegungsrate, keine Rüstungsanpassung.' : 'Race speed, no armor adjustment.')}
        </p>
      </>
    ),
    ac: () => (
      <>
        <div className="sf-stat-row two">
          <div className="sf-stat-box big">
            <span className="sf-stat-value">{eac}</span>
            <span className="sf-stat-label">EAC</span>
            <StatBadges buffSources={buffTags.eac} condSources={condTags.eac} />
          </div>
          <div className="sf-stat-box big">
            <span className="sf-stat-value">{kac}</span>
            <span className="sf-stat-label">KAC</span>
            <StatBadges buffSources={buffTags.kac} condSources={condTags.kac} />
          </div>
        </div>
        <p className="char-hint">
          {armor ? `${L ? 'Angelegt' : 'Worn'}: ${armor.name} (ERK +${armor.erk_bonus}, KRK +${armor.krk_bonus}${armor.max_ge_bonus != null ? `, max. GE-Bonus +${armor.max_ge_bonus}` : ''})`
                 : (L ? 'Keine Rüstung angelegt (in Tab „Ausrüstung" ausrüsten).' : 'No armor worn (equip in "Gear" tab).')}
        </p>
      </>
    ),
    attack: () => (
      <>
        <select className="bio-select" value={weaponName} onChange={e => setWeaponName(e.target.value)}>
          <option value="">{L ? '— Waffe wählen —' : '— choose weapon —'}</option>
          {WEAPON_CATEGORIES.map(([key, label]) => (
            <optgroup key={key} label={label}>
              {(weaponsData[key] || []).map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
            </optgroup>
          ))}
          {getHBWeapons().length > 0 && (
            <optgroup label="Homebrew">
              {getHBWeapons().map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
            </optgroup>
          )}
        </select>
        {weapon && (
          <div className="combat-weapon-card">
            <div className="cwc-row"><span>{L ? 'Angriffsbonus' : 'Attack bonus'}</span><strong>{attackBonus >= 0 ? `+${attackBonus}` : attackBonus} <StatBadges buffSources={attackBuffSources} condSources={attackCondSources} /></strong></div>
            <div className="cwc-row">
              <span>{L ? 'Schaden' : 'Damage'}</span>
              <strong>
                {weapon.schaden || '—'}{damageModifier !== 0 ? ` (${damageModifier >= 0 ? '+' : ''}${damageModifier})` : ''} <StatBadges buffSources={buffTags.damage} condSources={condTags.damage} />
              </strong>
            </div>
            {weapon.kritisch && <div className="cwc-row"><span>{L ? 'Kritisch' : 'Critical'}</span><strong>{weapon.kritisch}</strong></div>}
            {weapon.reichweite && <div className="cwc-row"><span>{L ? 'Reichweite' : 'Range'}</span><strong>{weapon.reichweite}</strong></div>}
            {weapon.sondereigenschaften && <p className="char-hint">{weapon.sondereigenschaften}</p>}
          </div>
        )}
      </>
    ),
    conditions: () => (
      <>
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
      </>
    ),
    buffs: () => <BuffTracker char={char} setActiveBuffs={setActiveBuffs} lang={lang} hideTitle />,
    resources: () => <ResourcesPanel char={char} setResources={setResources} lang={lang} hideTitle />,
  }

  return (
    <div className="section combat-tab">
      {order.map((id, idx) => {
        const isCollapsed = collapsed.has(id)
        return (
          <section key={id}>
            <div className="ct-heading-row">
              <button className="ct-collapse-btn" onClick={() => toggleCollapsed(id)} title={isCollapsed ? (L ? 'Aufklappen' : 'Expand') : (L ? 'Zuklappen' : 'Collapse')}>
                {isCollapsed ? '▶' : '▼'}
              </button>
              <h3 className="section-title ct-heading-clk" onClick={() => toggleCollapsed(id)}>
                {PHONE_HEADINGS[id]
                  ? <><span className="ct-heading-full">{HEADINGS[id]}</span><span className="ct-heading-phone">{PHONE_HEADINGS[id]}</span></>
                  : HEADINGS[id]}
              </h3>
              {isCollapsed && SUMMARIES[id] && <span className="ct-heading-summary">{SUMMARIES[id]}</span>}
              <div className="ct-move-btns">
                <button className="ct-move-btn" disabled={idx === 0} onClick={() => moveSection(id, -1)} title={L ? 'Nach oben' : 'Move up'}>↑</button>
                <button className="ct-move-btn" disabled={idx === order.length - 1} onClick={() => moveSection(id, 1)} title={L ? 'Nach unten' : 'Move down'}>↓</button>
              </div>
            </div>
            {!isCollapsed && <div className="ct-body">{BODIES[id]()}</div>}
          </section>
        )
      })}
    </div>
  )
}

function ResourceBox({ label, full, max, current, onChange, onFill }) {
  const value = current ?? max
  return (
    <div className="sf-resource-box" title={full}>
      <span className="sf-resource-label">{label}</span>
      <div className="sf-resource-values">
        <NumberField className="sf-resource-input" min={0} value={value} onCommit={onChange} />
        <span className="sf-resource-max">/ {max}</span>
      </div>
      <button className="sf-resource-fill" onClick={onFill}>↺</button>
    </div>
  )
}

function StatBox({ label, value, buffSources, condSources }) {
  return (
    <div className="sf-stat-box">
      <span className="sf-stat-value">{value}</span>
      <span className="sf-stat-label">{label}</span>
      <StatBadges buffSources={buffSources} condSources={condSources} />
    </div>
  )
}
