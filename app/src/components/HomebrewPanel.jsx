import { useState } from 'react'
import './HomebrewPanel.css'

// Schilde gibt es in SF1e nicht als eigene RK-Quelle (anders als in
// Pathfinder 1e, wo diese Kategorie herkommt) - deshalb hier bewusst nicht
// mit aufgeführt statt eine Wirkung vorzutäuschen, die die Engine gar nicht
// berechnen könnte.
const TYPES = [
  { id: 'classes',  de: 'Klassen',   en: 'Classes'  },
  { id: 'races',    de: 'Völker',    en: 'Races'    },
  { id: 'weapons',  de: 'Waffen',    en: 'Weapons'  },
  { id: 'armor',    de: 'Rüstungen', en: 'Armor'    },
]

const EMPTY = {
  classes: { name: { de: '' }, key_ability: 'ST', hp_per_level: 6, ap_base_per_level: 4, skill_ranks_per_level_formula: 'IN-Modifikator + 4', bab_type: '3/4', good_saves: ['ref'] },
  races:   { name: { de: '' }, size: 'Mittelgroß', speed_m: 9, hp_bonus: 0, ability_mods_text: '' },
  weapons: { name: { de: '' }, schaden: '1W6', kritisch: '', stufe: 1, preis: 0, last: '1', sondereigenschaften: '', is_melee: true, is_two_handed: false },
  armor:   { name: { de: '' }, category: 'light', stufe: 1, preis: 0, erk_bonus: 0, krk_bonus: 0, max_ge_bonus: 8, ruestungsmalus: 0 },
}

const SIZE_OPTIONS = ['Winzig', 'Klein', 'Mittelgroß', 'Groß', 'Riesig', 'Gigantisch', 'Kolossal']

export function HomebrewPanel({ hb, saveHBItem, deleteHB, onClose, lang }) {
  const L = lang === 'de'
  const [type, setType]   = useState('classes')
  const [editId, setEditId] = useState(null)
  const [draft, setDraft]   = useState(null)

  const items = hb[type] ?? []

  function openNew() {
    setDraft({ ...EMPTY[type] })
    setEditId('__new__')
  }

  function openEdit(item) {
    setDraft(JSON.parse(JSON.stringify(item)))
    setEditId(item.id)
  }

  function handleSave() {
    if (!draft) return
    const item = editId === '__new__' ? draft : { ...draft, id: editId }
    saveHBItem(type, item)
    setEditId(null)
    setDraft(null)
  }

  function handleDelete() {
    if (editId && editId !== '__new__') deleteHB(type, editId)
    setEditId(null)
    setDraft(null)
  }

  function switchType(t) {
    setType(t)
    setEditId(null)
    setDraft(null)
  }

  return (
    <div className="hb-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="hb-panel">
        <div className="hb-header">
          <span className="hb-title">⚙ {L ? 'Homebrew' : 'Homebrew'}</span>
          <button className="hb-close" onClick={onClose}>✕</button>
        </div>

        {/* Type tabs */}
        <div className="hb-type-tabs">
          {TYPES.map(t => (
            <button key={t.id}
              className={`hb-type-btn ${type === t.id ? 'active' : ''}`}
              onClick={() => switchType(t.id)}>
              {t[lang] ?? t.de}
              {hb[t.id]?.length > 0 && <span className="hb-count">{hb[t.id].length}</span>}
            </button>
          ))}
        </div>

        {/* Edit form */}
        {editId && draft && (
          <div className="hb-form">
            {type === 'classes'  && <ClassForm  draft={draft} setDraft={setDraft} L={L} />}
            {type === 'races'    && <RaceForm   draft={draft} setDraft={setDraft} L={L} />}
            {type === 'weapons'  && <WeaponForm draft={draft} setDraft={setDraft} L={L} />}
            {type === 'armor'    && <ArmorForm  draft={draft} setDraft={setDraft} L={L} />}
            <div className="hb-form-actions">
              {editId !== '__new__' && (
                <button className="hb-del-btn" onClick={handleDelete} title={L ? 'Löschen' : 'Delete'}>🗑</button>
              )}
              <button className="hb-cancel-btn" onClick={() => { setEditId(null); setDraft(null) }} title={L ? 'Abbrechen' : 'Cancel'}>
                ✕
              </button>
              <button className="hb-save-btn" onClick={handleSave}
                disabled={!draft?.name?.de?.trim()} title={L ? 'Speichern' : 'Save'}>
                ✓
              </button>
            </div>
          </div>
        )}

        {/* Item list */}
        <div className="hb-list">
          {items.length === 0 && !editId && (
            <p className="hb-empty">{L ? 'Noch keine Einträge.' : 'No entries yet.'}</p>
          )}
          {items.map(item => (
            <div key={item.id}
              className={`hb-item ${editId === item.id ? 'editing' : ''}`}
              onClick={() => editId !== item.id && openEdit(item)}>
              <span className="hb-item-name">{item.name?.de}</span>
              <span className="hb-item-meta">{itemMeta(type, item, L)}</span>
            </div>
          ))}
        </div>

        {!editId && (
          <button className="hb-add-btn" onClick={openNew}>
            + {L ? 'Neu' : 'New'}
          </button>
        )}
      </div>
    </div>
  )
}

function itemMeta(type, item, L) {
  if (type === 'classes') return `${item.key_ability} · ${item.bab_type} GAB · TP${item.hp_per_level}/AP${item.ap_base_per_level}`
  if (type === 'races')   return `${item.size} · ${item.speed_m}m · +${item.hp_bonus || 0} TP`
  if (type === 'weapons') return `${item.schaden}${item.kritisch ? ` · ${item.kritisch}` : ''} · ${item.is_melee ? (L ? 'Nahkampf' : 'Melee') : (L ? 'Fernkampf' : 'Ranged')}`
  if (type === 'armor')   return `ERK+${item.erk_bonus || 0} / KRK+${item.krk_bonus || 0} · ${item.category}`
  return ''
}

// ── Sub-forms ──────────────────────────────────────────────────────────────

function Row({ label, children }) {
  return (
    <div className="hbf-row">
      <label className="hbf-label">{label}</label>
      <div className="hbf-ctrl">{children}</div>
    </div>
  )
}

const ABILITY_OPTIONS = ['ST', 'GE', 'KO', 'IN', 'WE', 'CH']

function ClassForm({ draft, setDraft, L }) {
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }))
  const setName = v => setDraft(d => ({ ...d, name: { de: v } }))
  const toggleSave = s => setDraft(d => {
    const gs = d.good_saves ?? []
    return { ...d, good_saves: gs.includes(s) ? gs.filter(x => x !== s) : [...gs, s] }
  })
  return (
    <>
      <Row label={L ? 'Name' : 'Name'}>
        <input className="hbf-input" value={draft.name?.de ?? ''} onChange={e => setName(e.target.value)} autoFocus />
      </Row>
      <Row label={L ? 'Schlüsselattribut' : 'Key ability'}>
        <select className="hbf-select" value={draft.key_ability} onChange={e => set('key_ability', e.target.value)}>
          {ABILITY_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </Row>
      <Row label={L ? 'TP/Stufe' : 'HP/level'}>
        <input className="hbf-input hbf-short" type="number" min={1} max={10} value={draft.hp_per_level} onChange={e => set('hp_per_level', Number(e.target.value))} />
      </Row>
      <Row label={L ? 'AP-Basis/Stufe' : 'SP base/level'}>
        <input className="hbf-input hbf-short" type="number" min={1} max={10} value={draft.ap_base_per_level} onChange={e => set('ap_base_per_level', Number(e.target.value))} />
      </Row>
      <Row label={L ? 'FP-Formel' : 'Skill rank formula'}>
        <input className="hbf-input" placeholder="IN-Modifikator + 4" value={draft.skill_ranks_per_level_formula ?? ''} onChange={e => set('skill_ranks_per_level_formula', e.target.value)} />
      </Row>
      <Row label="GAB">
        <select className="hbf-select" value={draft.bab_type} onChange={e => set('bab_type', e.target.value)}>
          <option value="full">{L ? 'Voll (=Stufe)' : 'Full (=level)'}</option>
          <option value="3/4">¾ (×0,75)</option>
          <option value="half">{L ? 'Halb (×0,5)' : 'Half (×0.5)'}</option>
        </select>
      </Row>
      <Row label={L ? 'Gute RWs' : 'Good saves'}>
        <div className="hbf-checks">
          {['ref', 'will', 'zah'].map(s => (
            <label key={s} className="hbf-check">
              <input type="checkbox" checked={(draft.good_saves ?? []).includes(s)}
                onChange={() => toggleSave(s)} />
              {s === 'ref' ? 'Ref' : s === 'will' ? 'Wil' : 'Zäh'}
            </label>
          ))}
        </div>
      </Row>
      <p className="hb-note">{L
        ? 'GAB/Rettungswürfe werden aus diesen Angaben für alle 20 Stufen berechnet (gleiches Muster wie die 7 Kernklassen). Klassenmerkmale je Stufe können hier nicht erfasst werden.'
        : 'BAB/saves are generated for all 20 levels from these values. Per-level class features cannot be entered here.'}</p>
    </>
  )
}

function RaceForm({ draft, setDraft, L }) {
  const setName = v => setDraft(d => ({ ...d, name: { de: v } }))
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }))
  return (
    <>
      <Row label={L ? 'Name' : 'Name'}>
        <input className="hbf-input" value={draft.name?.de ?? ''} onChange={e => setName(e.target.value)} autoFocus />
      </Row>
      <Row label={L ? 'Größe' : 'Size'}>
        <select className="hbf-select" value={draft.size ?? 'Mittelgroß'} onChange={e => set('size', e.target.value)}>
          {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Row>
      <Row label={L ? 'Bewegung (m)' : 'Speed (m)'}>
        <input className="hbf-input hbf-short" type="number" min={3} max={18} step={3}
          value={draft.speed_m ?? 9} onChange={e => set('speed_m', Number(e.target.value))} />
      </Row>
      <Row label={L ? 'TP-Bonus' : 'HP bonus'}>
        <input className="hbf-input hbf-short" type="number" min={0} max={8}
          value={draft.hp_bonus ?? 0} onChange={e => set('hp_bonus', Number(e.target.value))} />
      </Row>
      <Row label={L ? 'Attributboni' : 'Ability mods'}>
        <input className="hbf-input" placeholder="z.B. ST+2, KO−2"
          value={draft.ability_mods_text ?? ''}
          onChange={e => set('ability_mods_text', e.target.value)} />
      </Row>
      <p className="hb-note">{L
        ? 'Attributboni sind reiner Hinweistext — trage den fertigen Attributswert weiterhin selbst im Charakter-Tab ein (wie bei den Kernvölkern).'
        : 'Ability mods are display-only text — enter the final ability score yourself in the Character tab (same as core races).'}</p>
    </>
  )
}

function WeaponForm({ draft, setDraft, L }) {
  const setName = v => setDraft(d => ({ ...d, name: { de: v } }))
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }))
  return (
    <>
      <Row label={L ? 'Name' : 'Name'}>
        <input className="hbf-input" value={draft.name?.de ?? ''} onChange={e => setName(e.target.value)} autoFocus />
      </Row>
      <Row label={L ? 'Schaden' : 'Damage'}>
        <input className="hbf-input hbf-short" placeholder="1W8 K" value={draft.schaden ?? ''} onChange={e => set('schaden', e.target.value)} />
      </Row>
      <Row label={L ? 'Kritisch' : 'Critical'}>
        <input className="hbf-input hbf-short" placeholder="z.B. Entzünden" value={draft.kritisch ?? ''} onChange={e => set('kritisch', e.target.value)} />
      </Row>
      <Row label={L ? 'Art' : 'Type'}>
        <div className="hbf-checks">
          <label className="hbf-check">
            <input type="checkbox" checked={!!draft.is_melee} onChange={e => set('is_melee', e.target.checked)} />
            {L ? 'Nahkampf' : 'Melee'}
          </label>
          <label className="hbf-check">
            <input type="checkbox" checked={!!draft.is_two_handed} onChange={e => set('is_two_handed', e.target.checked)} />
            {L ? 'Zweihändig' : 'Two-handed'}
          </label>
        </div>
      </Row>
      <Row label={L ? 'Gegenstandsstufe' : 'Item level'}>
        <input className="hbf-input hbf-short" type="number" min={1} max={20} value={draft.stufe ?? 1} onChange={e => set('stufe', Number(e.target.value))} />
      </Row>
      <Row label={L ? 'Preis (Credits)' : 'Price (credits)'}>
        <input className="hbf-input hbf-short" type="number" min={0} value={draft.preis ?? 0} onChange={e => set('preis', Number(e.target.value))} />
      </Row>
      <Row label={L ? 'Sondereigenschaften' : 'Special properties'}>
        <input className="hbf-input" value={draft.sondereigenschaften ?? ''} onChange={e => set('sondereigenschaften', e.target.value)} />
      </Row>
      <p className="hb-note">{L
        ? '"Nahkampf"/"Zweihändig" steuern, ob der Stärkemodifikator (1x bzw. 1,5x) zum Schaden addiert wird.'
        : '"Melee"/"Two-handed" control whether the strength modifier (1x or 1.5x) is added to damage.'}</p>
    </>
  )
}

function ArmorForm({ draft, setDraft, L }) {
  const setName = v => setDraft(d => ({ ...d, name: { de: v } }))
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }))
  return (
    <>
      <Row label={L ? 'Name' : 'Name'}>
        <input className="hbf-input" value={draft.name?.de ?? ''} onChange={e => setName(e.target.value)} autoFocus />
      </Row>
      <Row label={L ? 'Kategorie' : 'Category'}>
        <select className="hbf-select" value={draft.category ?? 'light'} onChange={e => set('category', e.target.value)}>
          <option value="light">{L ? 'Leicht' : 'Light'}</option>
          <option value="heavy">{L ? 'Schwer' : 'Heavy'}</option>
          <option value="power">{L ? 'Servorüstung' : 'Powered'}</option>
        </select>
      </Row>
      <Row label="ERK-Bonus">
        <input className="hbf-input hbf-short" type="number" min={0} max={15} value={draft.erk_bonus ?? 0} onChange={e => set('erk_bonus', Number(e.target.value))} />
      </Row>
      <Row label="KRK-Bonus">
        <input className="hbf-input hbf-short" type="number" min={0} max={15} value={draft.krk_bonus ?? 0} onChange={e => set('krk_bonus', Number(e.target.value))} />
      </Row>
      <Row label={L ? 'Max GE-Bonus' : 'Max Dex bonus'}>
        <input className="hbf-input hbf-short" type="number" min={0} max={12} value={draft.max_ge_bonus ?? 8} onChange={e => set('max_ge_bonus', Number(e.target.value))} />
      </Row>
      <Row label={L ? 'Rüstungsmalus' : 'Armor check penalty'}>
        <input className="hbf-input hbf-short" type="number" max={0} value={draft.ruestungsmalus ?? 0} onChange={e => set('ruestungsmalus', Number(e.target.value))} />
      </Row>
      <Row label={L ? 'Gegenstandsstufe' : 'Item level'}>
        <input className="hbf-input hbf-short" type="number" min={1} max={20} value={draft.stufe ?? 1} onChange={e => set('stufe', Number(e.target.value))} />
      </Row>
      <Row label={L ? 'Preis (Credits)' : 'Price (credits)'}>
        <input className="hbf-input hbf-short" type="number" min={0} value={draft.preis ?? 0} onChange={e => set('preis', Number(e.target.value))} />
      </Row>
    </>
  )
}
