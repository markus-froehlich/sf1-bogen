import { useMemo, useState } from 'react'
import weaponsData from '../data/weapons.json'
import conditionsData from '../data/conditions.json'
import { computeCharacterStats, allArmor } from '../engine/characterStats.js'
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

// Sucheingabe statt riesigem <select> mit 350+ Einträgen (wie pf1-bogen).
function WeaponSearch({ allWeapons, onSelect, onCancel, lang }) {
  const L = lang === 'de'
  const [query, setQuery] = useState('')
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return allWeapons.filter(w => w.name.toLowerCase().includes(q)).slice(0, 10)
  }, [query, allWeapons])

  return (
    <div className="ws-search-wrap">
      <input
        className="ws-search-input"
        placeholder={L ? 'Waffe suchen…' : 'Search weapon…'}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') onCancel() }}
        autoFocus
      />
      {query.length > 0 && (
        <div className="ws-suggestions">
          {suggestions.length > 0 ? suggestions.map(w => (
            <div key={w.name} className="ws-suggestion-item" onMouseDown={() => onSelect(w.name)}>
              <span className="ws-sug-name">{w.name}</span>
              <span className="ws-sug-cat">{w._category}</span>
            </div>
          )) : (
            <div className="ws-sug-empty">{L ? 'Keine Treffer' : 'No results'}</div>
          )}
        </div>
      )}
    </div>
  )
}

// Sucheingabe für Rüstung direkt in der Rüstungsklassen-Sektion (wie
// pf1-bogens GearSelector) - ohne Verzauberungs-Eingabe, da SF1e-Rüstungen
// ihre Boni fest im Gegenstand tragen statt über einen Bonus zu stapeln.
function ArmorSearch({ allArmors, onSelect, onCancel, lang }) {
  const L = lang === 'de'
  const [query, setQuery] = useState('')
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return allArmors.filter(a => a.name.toLowerCase().includes(q)).slice(0, 10)
  }, [query, allArmors])

  return (
    <div className="ws-search-wrap">
      <input
        className="ws-search-input"
        placeholder={L ? 'Rüstung suchen…' : 'Search armor…'}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') onCancel() }}
        autoFocus
      />
      {query.length > 0 && (
        <div className="ws-suggestions">
          {suggestions.length > 0 ? suggestions.map(a => (
            <div key={a.name} className="ws-suggestion-item" onMouseDown={() => onSelect(a.name)}>
              <span className="ws-sug-name">{a.name}</span>
              <span className="ws-sug-cat">{a._category}</span>
            </div>
          )) : (
            <div className="ws-sug-empty">{L ? 'Keine Treffer' : 'No results'}</div>
          )}
        </div>
      )}
    </div>
  )
}

export function CombatTab({ char, update, setConditions, setActiveBuffs, setResources, setCombatMisc, lang }) {
  const L = lang === 'de'
  const stats = useMemo(() => computeCharacterStats(char), [char])
  const { abilityMods, tp, ap, rp, bab, saveRef, saveWill, saveZah, eac, kac, armor, speed, initiative, hasImprovedInitiative, initiativeFeatBonus, buffTotals, buffTags, condTags } = stats
  const weapons = useMemo(allWeapons, [])
  const [isAddingWeapon, setIsAddingWeapon] = useState(false)
  const [editingWeaponIdx, setEditingWeaponIdx] = useState(null)
  const [isEditingArmor, setIsEditingArmor] = useState(false)
  const armors = useMemo(() => allArmor().map(a => ({
    ...a,
    _category: a.category === 'light' ? (L ? 'Leicht' : 'Light') : a.category === 'heavy' ? (L ? 'Schwer' : 'Heavy') : (L ? 'Servo' : 'Powered'),
  })), [L])

  function equipArmor(name) {
    update({ equipped: { armor_id: name } })
    setIsEditingArmor(false)
  }
  function unequipArmor() {
    update({ equipped: { armor_id: '' } })
  }

  const [order, moveSection] = useSectionOrder('sf1_combat_order', COMBAT_SECTIONS_DEFAULT)
  const [collapsed, toggleCollapsed] = useCollapsed('sf1_combat_collapsed')

  const activeConditions = new Set(char.conditions ?? [])
  const current = char.resources_current ?? { tp: null, ap: null, rp: null }
  const combatMisc = char.combat_misc ?? {}

  function setResourceCurrent(key, value) {
    update({ resources_current: { [key]: Number(value) } })
  }
  function fillResource(key, max) {
    update({ resources_current: { [key]: max } })
  }
  function quickAdjust(key, current_, max, delta) {
    const base = current_ ?? max
    setResourceCurrent(key, base + delta)
  }

  function toggleCondition(name) {
    setConditions(prev => {
      const s = new Set(prev)
      if (s.has(name)) s.delete(name)
      else s.add(name)
      return [...s]
    })
  }

  // Mehrere gleichzeitig geführte Waffen statt einer einzigen Auswahl (wie
  // pf1-bogen) - Namen statt IDs, da weapons.json keine IDs hat.
  const equippedWeaponNames = char.equipped?.weapon_ids ?? []
  function addWeapon(name) {
    update({ equipped: { weapon_ids: [...equippedWeaponNames, name] } })
    setIsAddingWeapon(false)
  }
  function removeWeapon(idx) {
    update({ equipped: { weapon_ids: equippedWeaponNames.filter((_, i) => i !== idx) } })
  }
  function changeWeapon(idx, name) {
    update({ equipped: { weapon_ids: equippedWeaponNames.map((n, i) => i === idx ? name : n) } })
    setEditingWeaponIdx(null)
  }

  function computeWeaponAttack(weapon) {
    if (!weapon) return null
    const attackBonus = weapon._isRanged
      ? rangedAttackBonus({ baseAttackBonus: bab, dexModifier: abilityMods.GE, otherModifiers: buffTotals.attack })
      : meleeAttackBonus({ baseAttackBonus: bab, strengthModifier: abilityMods.ST, otherModifiers: buffTotals.attack })
    // Angriffsbonus hängt je nach Waffe von ST (Nahkampf) oder GE (Fernkampf)
    // ab - ein Buff/Zustand, der nur diesen Attributsmodifikator ändert (z.B.
    // Gelähmt: GE -5), rechnet sich schon korrekt in attackBonus ein, taucht
    // aber ohne diesen Merge nicht als Badge auf.
    const attackAbilityKey = weapon._isRanged ? 'GE' : 'ST'
    const attackBuffSources = [...buffTags.attack, ...buffTags[attackAbilityKey]]
    const attackCondSources = [...condTags.attack, ...condTags[attackAbilityKey]]
    const damageModifier = computeWeaponDamageModifier({ isMelee: weapon._isMelee, isTwoHanded: weapon._isTwoHanded, strengthModifier: abilityMods.ST, otherModifiers: buffTotals.damage })
    return { attackBonus, attackBuffSources, attackCondSources, damageModifier }
  }

  const HEADINGS = {
    tp: L ? 'Trefferpunkte, Ausdauer & Reserve' : 'Hit Points, Stamina & Resolve',
    kampfwerte: L ? 'Kampfwerte' : 'Combat stats',
    speed: L ? 'Bewegung' : 'Movement',
    ac: L ? 'Rüstungsklassen' : 'Armor Class',
    attack: L ? 'Waffen' : 'Weapons',
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
    kampfwerte: `${L ? 'GAB' : 'BAB'} ${bab >= 0 ? '+' : ''}${bab} · Init ${initiative >= 0 ? '+' : ''}${initiative} · Ref ${saveRef >= 0 ? '+' : ''}${saveRef}/Wil ${saveWill >= 0 ? '+' : ''}${saveWill}/Zäh ${saveZah >= 0 ? '+' : ''}${saveZah}`,
    speed: `${L ? 'Zu Fuß' : 'Walk'} ${speed} m`,
    ac: `EAC ${eac} · KAC ${kac}`,
    attack: equippedWeaponNames.length > 0 ? equippedWeaponNames.join(' · ') : '',
    conditions: activeConditions.size > 0 ? `${activeConditions.size} ${L ? 'aktiv' : 'active'}` : '',
    buffs: activeBuffCount > 0 ? `${activeBuffCount} ${L ? 'aktiv' : 'active'}` : '',
    resources: (char.resources ?? []).length > 0 ? `${(char.resources ?? []).length}` : '',
  }

  const BODIES = {
    tp: () => (
      <>
        <div className="sf-resource-row">
          <ResourceBox label="TP" full={L ? 'Trefferpunkte' : 'Hit Points'} max={tp} current={current.tp} onChange={v => setResourceCurrent('tp', v)} onFill={() => fillResource('tp', tp)} onQuick={d => quickAdjust('tp', current.tp, tp, d)} />
          <ResourceBox label="AP" full={L ? 'Ausdauerpunkte' : 'Stamina Points'} max={ap} current={current.ap} onChange={v => setResourceCurrent('ap', v)} onFill={() => fillResource('ap', ap)} onQuick={d => quickAdjust('ap', current.ap, ap, d)} />
          <ResourceBox label="RP" full={L ? 'Reservepunkte' : 'Resolve Points'} max={rp} current={current.rp} onChange={v => setResourceCurrent('rp', v)} onFill={() => fillResource('rp', rp)} onQuick={d => quickAdjust('rp', current.rp, rp, d)} />
        </div>
        <label className="tp-temp-field">
          <span>{L ? 'Temporäre TP' : 'Temp HP'}</span>
          <NumberField min={0} value={combatMisc.tp_temp || 0} onCommit={v => setCombatMisc('tp_temp', v)} />
        </label>
      </>
    ),
    kampfwerte: () => (
      <>
        <div className="sf-stat-row five">
          <StatBox label={L ? 'GAB' : 'BAB'} value={bab >= 0 ? `+${bab}` : bab} />
          <StatBox label={L ? 'Init' : 'Init'} value={initiative >= 0 ? `+${initiative}` : initiative} buffSources={buffTags.initiative} condSources={condTags.initiative} />
          <StatBox label={L ? 'Reflex' : 'Reflex'} value={(saveRef + (Number(combatMisc.save_ref_misc) || 0)) >= 0 ? `+${saveRef + (Number(combatMisc.save_ref_misc) || 0)}` : saveRef + (Number(combatMisc.save_ref_misc) || 0)} buffSources={buffTags.saveRef} condSources={condTags.saveRef} />
          <StatBox label={L ? 'Wille' : 'Will'} value={(saveWill + (Number(combatMisc.save_will_misc) || 0)) >= 0 ? `+${saveWill + (Number(combatMisc.save_will_misc) || 0)}` : saveWill + (Number(combatMisc.save_will_misc) || 0)} buffSources={buffTags.saveWill} condSources={condTags.saveWill} />
          <StatBox label={L ? 'Zähigkeit' : 'Fortitude'} value={(saveZah + (Number(combatMisc.save_zah_misc) || 0)) >= 0 ? `+${saveZah + (Number(combatMisc.save_zah_misc) || 0)}` : saveZah + (Number(combatMisc.save_zah_misc) || 0)} buffSources={buffTags.saveZah} condSources={condTags.saveZah} />
        </div>
        <div className="save-misc-grid">
          {[
            ['save_ref', L ? 'Reflex' : 'Reflex'],
            ['save_will', L ? 'Wille' : 'Will'],
            ['save_zah', L ? 'Zähigkeit' : 'Fortitude'],
          ].map(([key, label]) => (
            <div key={key} className="save-misc-cell">
              <span className="save-misc-label">{label}</span>
              <NumberField className="save-misc-input" value={combatMisc[`${key}_misc`] || 0} onCommit={v => setCombatMisc(`${key}_misc`, v)} />
              <input
                className="save-misc-note"
                placeholder={L ? 'Notiz (z.B. Gegenstand)' : 'Note (e.g. item)'}
                value={combatMisc[`${key}_note`] || ''}
                onChange={e => setCombatMisc(`${key}_note`, e.target.value)}
              />
            </div>
          ))}
        </div>
      </>
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
        <div className="extra-speed-grid">
          {[
            ['speed_fly', L ? 'Flug' : 'Fly'],
            ['speed_swim', L ? 'Schwimmen' : 'Swim'],
            ['speed_climb', L ? 'Klettern' : 'Climb'],
          ].map(([key, label]) => (
            <label key={key} className="extra-speed-field">
              <span>{label}</span>
              <NumberField min={0} value={combatMisc[key] || 0} onCommit={v => setCombatMisc(key, v)} />
              <span className="extra-speed-unit">m</span>
            </label>
          ))}
        </div>
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
        <div className="weapon-slot">
          <div className="ws-select-row">
            {isEditingArmor ? (
              <ArmorSearch allArmors={armors} lang={lang} onSelect={equipArmor} onCancel={() => setIsEditingArmor(false)} />
            ) : (
              <button className="ws-name-btn" onClick={() => setIsEditingArmor(true)} title={L ? 'Rüstung wechseln' : 'Change armor'}>
                {armor ? armor.name : (L ? 'Keine Rüstung angelegt' : 'No armor worn')}
              </button>
            )}
            {armor && !isEditingArmor && (
              <button className="ws-clear-btn" onClick={unequipArmor} title={L ? 'Ablegen' : 'Unequip'}>×</button>
            )}
          </div>
          {armor && (
            <p className="char-hint">
              ERK +{armor.erk_bonus}, KRK +{armor.krk_bonus}{armor.max_ge_bonus != null ? `, max. GE-Bonus +${armor.max_ge_bonus}` : ''}{armor.ruestungsmalus ? `, Malus ${armor.ruestungsmalus}` : ''}
            </p>
          )}
        </div>
      </>
    ),
    attack: () => (
      <>
        {equippedWeaponNames.map((name, idx) => {
          const weapon = weapons.find(w => w.name === name) || null
          const comp = computeWeaponAttack(weapon)
          return (
            <div key={idx} className="weapon-slot">
              <div className="ws-select-row">
                <span className="ws-num">{idx + 1}</span>
                {editingWeaponIdx === idx ? (
                  <WeaponSearch
                    allWeapons={weapons}
                    lang={lang}
                    onSelect={n => changeWeapon(idx, n)}
                    onCancel={() => setEditingWeaponIdx(null)}
                  />
                ) : (
                  <button className="ws-name-btn" onClick={() => setEditingWeaponIdx(idx)} title={L ? 'Waffe wechseln' : 'Change weapon'}>
                    {name}
                  </button>
                )}
                <button className="ws-clear-btn" onClick={() => removeWeapon(idx)} title={L ? 'Entfernen' : 'Remove'}>×</button>
              </div>
              {weapon && comp && (
                <div className="combat-weapon-card">
                  <div className="cwc-row"><span>{L ? 'Angriffsbonus' : 'Attack bonus'}</span><strong>{comp.attackBonus >= 0 ? `+${comp.attackBonus}` : comp.attackBonus} <StatBadges buffSources={comp.attackBuffSources} condSources={comp.attackCondSources} /></strong></div>
                  <div className="cwc-row">
                    <span>{L ? 'Schaden' : 'Damage'}</span>
                    <strong>
                      {weapon.schaden || '—'}{comp.damageModifier !== 0 ? ` (${comp.damageModifier >= 0 ? '+' : ''}${comp.damageModifier})` : ''} <StatBadges buffSources={buffTags.damage} condSources={condTags.damage} />
                    </strong>
                  </div>
                  {weapon.kritisch && <div className="cwc-row"><span>{L ? 'Kritisch' : 'Critical'}</span><strong>{weapon.kritisch}</strong></div>}
                  {weapon.reichweite && <div className="cwc-row"><span>{L ? 'Reichweite' : 'Range'}</span><strong>{weapon.reichweite}</strong></div>}
                  {weapon.sondereigenschaften && <p className="char-hint">{weapon.sondereigenschaften}</p>}
                </div>
              )}
            </div>
          )
        })}

        {isAddingWeapon ? (
          <div className="weapon-slot ws-adding">
            <div className="ws-select-row">
              <WeaponSearch allWeapons={weapons} lang={lang} onSelect={addWeapon} onCancel={() => setIsAddingWeapon(false)} />
              <button className="ws-clear-btn" onClick={() => setIsAddingWeapon(false)} title={L ? 'Abbrechen' : 'Cancel'}>×</button>
            </div>
          </div>
        ) : (
          <button className="ws-add-btn" onClick={() => setIsAddingWeapon(true)}>+ {L ? 'Neue Waffe' : 'Add weapon'}</button>
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

function ResourceBox({ label, full, max, current, onChange, onFill, onQuick }) {
  const value = current ?? max
  return (
    <div className="sf-resource-box" title={full}>
      <span className="sf-resource-label">{label}</span>
      <div className="sf-resource-values">
        <NumberField className="sf-resource-input" min={0} value={value} onCommit={onChange} />
        <span className="sf-resource-max">/ {max}</span>
      </div>
      <div className="sf-resource-quick-row">
        <button className="sf-resource-quick" onClick={() => onQuick?.(-1)} title="−1">−1</button>
        <button className="sf-resource-quick" onClick={() => onQuick?.(1)} title="+1">+1</button>
        <button className="sf-resource-fill" onClick={onFill}>↺</button>
      </div>
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
