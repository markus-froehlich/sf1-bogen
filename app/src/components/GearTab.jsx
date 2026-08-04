import { useMemo, useState } from 'react'
import weaponsData from '../data/weapons.json'
import { allArmor } from '../engine/characterStats.js'
import { getHBWeapons } from '../engine/homebrew.js'
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

function allWeaponsFlat() {
  const core = WEAPON_CATEGORIES.flatMap(([key, label]) =>
    (weaponsData[key] || []).map(w => ({ ...w, _category: label }))
  )
  const homebrew = getHBWeapons().map(w => ({ ...w, _category: 'Homebrew' }))
  return [...core, ...homebrew]
}

// Sucheingabe statt riesigem <select> (wie im Kampf-Tab bei Waffen/Rüstung) -
// Konsistenz zwischen den beiden Stellen, an denen Waffen/Rüstungen gewählt werden.
function CatalogSearch({ items, placeholder, emptyLabel, onSelect, onCancel }) {
  const [query, setQuery] = useState('')
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return items.filter(it => it.name.toLowerCase().includes(q)).slice(0, 10)
  }, [query, items])

  return (
    <div className="ws-search-wrap">
      <input
        className="ws-search-input"
        placeholder={placeholder}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') onCancel() }}
        autoFocus
      />
      {query.length > 0 && (
        <div className="ws-suggestions">
          {suggestions.length > 0 ? suggestions.map(it => (
            <div key={it.name} className="ws-suggestion-item" onMouseDown={() => { onSelect(it); setQuery('') }}>
              <span className="ws-sug-name">{it.name}</span>
              <span className="ws-sug-cat">{it._category}</span>
            </div>
          )) : (
            <div className="ws-sug-empty">{emptyLabel}</div>
          )}
        </div>
      )}
    </div>
  )
}

const EMPTY_ITEM = { id: '', name: '', qty: 1, last: 0, price: 0, notes: '', bag: '' }

export function GearTab({ char, update, setInventory, lang }) {
  const L = lang === 'de'
  const armorList = useMemo(allArmor, [])
  const weaponList = useMemo(allWeaponsFlat, [])
  const armorSearchItems = useMemo(() => armorList.map(a => ({
    ...a,
    _category: a.category === 'light' ? (L ? 'Leicht' : 'Light') : a.category === 'heavy' ? (L ? 'Schwer' : 'Heavy') : (L ? 'Servo' : 'Powered'),
  })), [armorList, L])
  const [isAddingArmor, setIsAddingArmor] = useState(false)
  const [isAddingWeapon, setIsAddingWeapon] = useState(false)
  const [editId, setEditId] = useState(null)
  const [draft, setDraft] = useState(EMPTY_ITEM)
  const [confirmDelId, setConfirmDelId] = useState(null)

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
    setConfirmDelId(null)
    if (editId === id) setEditId(null)
  }
  function requestRemove(id) {
    setConfirmDelId(prev => prev === id ? null : id)
  }

  function addArmorToInventory(armor) {
    addItem({ id: genId(), name: armor.name, category: 'armor', qty: 1, last: armor.last ?? 0, price: armor.preis ?? 0, notes: '', bag: '' })
    setIsAddingArmor(false)
  }

  function addWeaponToInventory(weapon) {
    addItem({ id: genId(), name: weapon.name, category: 'weapon', qty: 1, last: weapon.last ?? 0, price: weapon.preis ?? 0, notes: '', bag: '' })
    setIsAddingWeapon(false)
  }

  function equipArmor(name) {
    update({ equipped: { armor_id: name } })
  }

  function openNewItem() {
    setDraft({ ...EMPTY_ITEM, id: genId() })
    setEditId('__new__')
  }
  function openEditItem(item) {
    setDraft({ ...EMPTY_ITEM, ...item })
    setEditId(item.id)
  }
  function saveDraft() {
    if (!draft.name.trim()) return
    setInventory(prev => {
      const list = prev.items ?? []
      if (editId === '__new__') return { ...prev, items: [...list, draft] }
      return { ...prev, items: list.map(it => it.id === editId ? draft : it) }
    })
    setEditId(null)
  }

  const groups = {}
  for (const it of items) {
    const key = it.bag?.trim() || ''
    if (!groups[key]) groups[key] = []
    groups[key].push(it)
  }
  const groupKeys = Object.keys(groups).sort((a, b) => {
    if (a === '') return -1
    if (b === '') return 1
    return a.localeCompare(b)
  })

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
        {isAddingArmor ? (
          <div className="gear-add-row">
            <CatalogSearch
              items={armorSearchItems}
              placeholder={L ? 'Rüstung suchen…' : 'Search armor…'}
              emptyLabel={L ? 'Keine Treffer' : 'No results'}
              onSelect={addArmorToInventory}
              onCancel={() => setIsAddingArmor(false)}
            />
            <button className="gear-add-btn" onClick={() => setIsAddingArmor(false)}>✕</button>
          </div>
        ) : (
          <button className="ws-add-btn" onClick={() => setIsAddingArmor(true)}>+ {L ? 'Rüstung ins Inventar' : 'Armor to inventory'}</button>
        )}
        {equippedArmorId && (
          <p className="char-hint">{L ? 'Angelegt' : 'Worn'}: <strong>{equippedArmorId}</strong> <button className="gear-unequip-btn" onClick={() => equipArmor('')}>✕</button></p>
        )}
      </section>

      <section>
        <h3 className="section-title">{L ? 'Waffe zum Inventar hinzufügen' : 'Add weapon to inventory'}</h3>
        {isAddingWeapon ? (
          <div className="gear-add-row">
            <CatalogSearch
              items={weaponList}
              placeholder={L ? 'Waffe suchen…' : 'Search weapon…'}
              emptyLabel={L ? 'Keine Treffer' : 'No results'}
              onSelect={addWeaponToInventory}
              onCancel={() => setIsAddingWeapon(false)}
            />
            <button className="gear-add-btn" onClick={() => setIsAddingWeapon(false)}>✕</button>
          </div>
        ) : (
          <button className="ws-add-btn" onClick={() => setIsAddingWeapon(true)}>+ {L ? 'Waffe ins Inventar' : 'Weapon to inventory'}</button>
        )}
      </section>

      <section>
        <h3 className="section-title">{L ? 'Inventar' : 'Inventory'}</h3>

        {editId && (
          <div className="gear-item-form">
            <input
              className="bio-input"
              placeholder={L ? 'Name' : 'Name'}
              value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              autoFocus
            />
            <div className="gear-form-grid3">
              <label className="gear-form-cell">
                <span>{L ? 'Menge' : 'Qty'}</span>
                <NumberField min={1} value={draft.qty} onCommit={v => setDraft(d => ({ ...d, qty: Math.max(1, Number(v) || 1) }))} />
              </label>
              <label className="gear-form-cell">
                <span>{L ? 'Last' : 'Bulk'}</span>
                <NumberField min={0} value={draft.last} onCommit={v => setDraft(d => ({ ...d, last: Number(v) || 0 }))} />
              </label>
              <label className="gear-form-cell">
                <span>{L ? 'Preis (Cr)' : 'Cost (Cr)'}</span>
                <NumberField min={0} value={draft.price} onCommit={v => setDraft(d => ({ ...d, price: Number(v) || 0 }))} />
              </label>
            </div>
            <input
              className="bio-input"
              list="gear-bag-suggestions"
              placeholder={L ? 'Behälter (Rucksack, Gürtel, … leer = getragen)' : 'Container (backpack, belt, … empty = worn)'}
              value={draft.bag}
              onChange={e => setDraft(d => ({ ...d, bag: e.target.value }))}
            />
            <datalist id="gear-bag-suggestions">
              <option value={L ? 'Rucksack' : 'Backpack'} />
              <option value={L ? 'Gürtel' : 'Belt'} />
              <option value={L ? 'Beutel' : 'Pouch'} />
              <option value={L ? 'Kiste' : 'Chest'} />
            </datalist>
            <input
              className="bio-input"
              placeholder={L ? 'Notiz' : 'Note'}
              value={draft.notes}
              onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
            />
            <div className="gear-form-actions">
              {editId !== '__new__' && (
                <button className="gear-form-del" onClick={() => removeItem(editId)} title={L ? 'Löschen' : 'Delete'}>🗑</button>
              )}
              <button className="gear-form-cancel" onClick={() => setEditId(null)} title={L ? 'Abbrechen' : 'Cancel'}>✕</button>
              <button className="gear-form-save" onClick={saveDraft} disabled={!draft.name.trim()} title={L ? 'Speichern' : 'Save'}>✓</button>
            </div>
          </div>
        )}

        {items.length === 0 && !editId && <p className="char-hint">{L ? 'Noch keine Gegenstände.' : 'No items yet.'}</p>}

        <div className="gear-item-list">
          {groupKeys.map(key => (
            <div key={key || '__worn__'}>
              {key && <div className="gear-bag-header">📦 {key}</div>}
              {groups[key].map(it => (
                <div key={it.id} className="gear-item-wrap">
                  <div className="gear-item-row" onClick={() => editId !== it.id && openEditItem(it)}>
                    <span className="gear-item-name">
                      {it.name}{it.qty > 1 ? ` ×${it.qty}` : ''}
                      {it.notes && <span className="gear-item-note"> — {it.notes}</span>}
                    </span>
                    <span className="gear-item-meta">{it.category === 'armor' && (
                      <button className="gear-equip-btn" onClick={e => { e.stopPropagation(); equipArmor(it.name) }} disabled={equippedArmorId === it.name}>
                        {equippedArmorId === it.name ? (L ? 'angelegt' : 'worn') : (L ? 'anlegen' : 'equip')}
                      </button>
                    )}</span>
                    <span className="gear-item-price">{it.price || 0}</span>
                    <button className="gear-item-del" onClick={e => { e.stopPropagation(); requestRemove(it.id) }}>🗑</button>
                  </div>
                  {confirmDelId === it.id && (
                    <div className="gear-confirm">
                      <span className="gear-confirm-label">{L ? 'Wirklich löschen?' : 'Really delete?'}</span>
                      <button className="gear-confirm-yes" onClick={() => removeItem(it.id)}>{L ? 'Ja' : 'Yes'}</button>
                      <button className="gear-confirm-no" onClick={() => setConfirmDelId(null)}>{L ? 'Abbrechen' : 'Cancel'}</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {!editId && (
          <button className="gear-add-item-btn" onClick={openNewItem}>+ {L ? 'Gegenstand hinzufügen' : 'Add item'}</button>
        )}
      </section>
    </div>
  )
}
