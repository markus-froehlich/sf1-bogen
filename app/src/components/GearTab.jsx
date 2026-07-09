import { useMemo, useState } from 'react'
import weaponsData from '../data/weapons.json'
import { allArmor } from '../engine/characterStats.js'
import { NumberField } from './NumberField.jsx'
import './GearTab.css'

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

function genId() { return 'itm_' + Math.random().toString(36).slice(2, 10) }

function loadValueToNumber(load) {
  if (load === '-' || load === null || load === undefined) return 0
  if (load === 'L') return 0.1
  return Number(load) || 0
}

export function GearTab({ char, update, setInventory, lang }) {
  const L = lang === 'de'
  const armorList = useMemo(allArmor, [])
  const [armorPick, setArmorPick] = useState('')
  const [weaponPick, setWeaponPick] = useState('')

  const items = char.inventory?.items ?? []
  const credits = char.credits ?? 0
  const equippedArmorId = char.equipped?.armor_id || ''

  const totalLoad = items.reduce((sum, it) => sum + loadValueToNumber(it.last) * (it.qty || 1), 0)
  const totalSpent = items.reduce((sum, it) => sum + (Number(it.price) || 0) * (it.qty || 1), 0)

  function setCredits(value) {
    update({ credits: Math.max(0, value) })
  }

  function addItem(item) {
    setInventory(prev => ({ ...prev, items: [...(prev.items ?? []), item] }))
  }

  function removeItem(id) {
    setInventory(prev => ({ ...prev, items: (prev.items ?? []).filter(it => it.id !== id) }))
  }

  function addArmorToInventory() {
    const armor = armorList.find(a => a.name === armorPick)
    if (!armor) return
    addItem({ id: genId(), name: armor.name, category: 'armor', qty: 1, last: armor.last ?? 0, price: armor.preis ?? 0 })
    setArmorPick('')
  }

  function addWeaponToInventory() {
    for (const [key] of WEAPON_CATEGORIES) {
      const w = (weaponsData[key] || []).find(w => w.name === weaponPick)
      if (w) {
        addItem({ id: genId(), name: w.name, category: 'weapon', qty: 1, last: w.last ?? 0, price: w.preis ?? 0 })
        break
      }
    }
    setWeaponPick('')
  }

  function equipArmor(name) {
    update({ equipped: { armor_id: name } })
  }

  return (
    <div className="section gear-tab">
      <section>
        <h3 className="section-title">{L ? 'Crediteinheiten' : 'Credits'}</h3>
        <div className="bio-field">
          <NumberField className="bio-input bio-input-num" min={0} value={credits} onCommit={setCredits} />
        </div>
        <p className="char-hint">
          {L ? `Ausgegeben laut Inventar: ${totalSpent} Credits · Gesamtlast: ${Math.round(totalLoad * 10) / 10}`
             : `Spent per inventory: ${totalSpent} credits · Total load: ${Math.round(totalLoad * 10) / 10}`}
        </p>
      </section>

      <section>
        <h3 className="section-title">{L ? 'Rüstung ausrüsten' : 'Equip armor'}</h3>
        <div className="gear-add-row">
          <select className="bio-select" value={armorPick} onChange={e => setArmorPick(e.target.value)}>
            <option value="">{L ? '— Rüstung wählen —' : '— choose armor —'}</option>
            <optgroup label={L ? 'Leichte Rüstungen' : 'Light armor'}>
              {armorList.filter(a => a.category === 'light').map(a => <option key={a.name} value={a.name}>{a.name} (Stufe {a.stufe})</option>)}
            </optgroup>
            <optgroup label={L ? 'Schwere Rüstungen' : 'Heavy armor'}>
              {armorList.filter(a => a.category === 'heavy').map(a => <option key={a.name} value={a.name}>{a.name} (Stufe {a.stufe})</option>)}
            </optgroup>
            <optgroup label={L ? 'Servorüstungen' : 'Powered armor'}>
              {armorList.filter(a => a.category === 'power').map(a => <option key={a.name} value={a.name}>{a.name} (Stufe {a.stufe})</option>)}
            </optgroup>
          </select>
          <button className="gear-add-btn" onClick={addArmorToInventory} disabled={!armorPick}>+ {L ? 'Ins Inventar' : 'To inventory'}</button>
        </div>
        {equippedArmorId && (
          <p className="char-hint">{L ? 'Angelegt' : 'Worn'}: <strong>{equippedArmorId}</strong> <button className="gear-unequip-btn" onClick={() => equipArmor('')}>✕</button></p>
        )}
      </section>

      <section>
        <h3 className="section-title">{L ? 'Waffe zum Inventar hinzufügen' : 'Add weapon to inventory'}</h3>
        <div className="gear-add-row">
          <select className="bio-select" value={weaponPick} onChange={e => setWeaponPick(e.target.value)}>
            <option value="">{L ? '— Waffe wählen —' : '— choose weapon —'}</option>
            {WEAPON_CATEGORIES.map(([key, label]) => (
              <optgroup key={key} label={label}>
                {(weaponsData[key] || []).map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
              </optgroup>
            ))}
          </select>
          <button className="gear-add-btn" onClick={addWeaponToInventory} disabled={!weaponPick}>+ {L ? 'Ins Inventar' : 'To inventory'}</button>
        </div>
      </section>

      <section>
        <h3 className="section-title">{L ? 'Inventar' : 'Inventory'}</h3>
        {items.length === 0 && <p className="char-hint">{L ? 'Noch keine Gegenstände.' : 'No items yet.'}</p>}
        <div className="gear-item-list">
          {items.map(it => (
            <div key={it.id} className="gear-item-row">
              <span className="gear-item-name">{it.name}{it.qty > 1 ? ` ×${it.qty}` : ''}</span>
              <span className="gear-item-meta">{it.category === 'armor' && (
                <button className="gear-equip-btn" onClick={() => equipArmor(it.name)} disabled={equippedArmorId === it.name}>
                  {equippedArmorId === it.name ? (L ? 'angelegt' : 'worn') : (L ? 'anlegen' : 'equip')}
                </button>
              )}</span>
              <span className="gear-item-price">{it.price || 0}</span>
              <button className="gear-item-del" onClick={() => removeItem(it.id)}>🗑</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
