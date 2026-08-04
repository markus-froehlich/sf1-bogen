import { useState } from 'react'
import './BuffTracker.css'

const STAT_DEFS = [
  { key: 'ST', de: 'ST', cat: 'attr' },
  { key: 'GE', de: 'GE', cat: 'attr' },
  { key: 'KO', de: 'KO', cat: 'attr' },
  { key: 'IN', de: 'IN', cat: 'attr' },
  { key: 'WE', de: 'WE', cat: 'attr' },
  { key: 'CH', de: 'CH', cat: 'attr' },
  { key: 'attack', de: 'Angriff', cat: 'combat' },
  { key: 'damage', de: 'Schaden', cat: 'combat' },
  { key: 'eac', de: 'EAC', cat: 'combat' },
  { key: 'kac', de: 'KAC', cat: 'combat' },
  { key: 'saveRef', de: 'Reflex', cat: 'saves' },
  { key: 'saveWill', de: 'Wille', cat: 'saves' },
  { key: 'saveZah', de: 'Zähigkeit', cat: 'saves' },
  { key: 'initiative', de: 'Init', cat: 'other' },
  { key: 'skills', de: 'Fertigk.', cat: 'other' },
  { key: 'perception', de: 'Wahrn.', cat: 'other' },
]

const CAT_LABELS_DE = { attr: 'Attribute', combat: 'Kampf', saves: 'Rettungswürfe', other: 'Sonstiges' }
const CAT_LABELS_EN = { attr: 'Attributes', combat: 'Combat', saves: 'Saves', other: 'Other' }
const CATS = ['attr', 'combat', 'saves', 'other']

const EMPTY_BONUSES = Object.fromEntries(STAT_DEFS.map(s => [s.key, 0]))

function genId() { return 'buff_' + Math.random().toString(36).slice(2, 9) }

function summaryStr(bonuses) {
  return STAT_DEFS
    .filter(s => Number(bonuses[s.key] ?? 0) !== 0)
    .map(s => `${s.de} ${Number(bonuses[s.key]) > 0 ? '+' : ''}${bonuses[s.key]}`)
    .join(' · ')
}

export function BuffTracker({ char, setActiveBuffs, lang, hideTitle = false }) {
  const L = lang === 'de'
  const CAT_LABELS = L ? CAT_LABELS_DE : CAT_LABELS_EN
  const buffs = char.active_buffs ?? []
  const [editing, setEditing] = useState(null) // null = closed, 'new' oder buff.id
  const [form, setForm] = useState({ name: '', notes: '', bonuses: { ...EMPTY_BONUSES } })
  const [open, setOpen] = useState(true)

  const activeCount = buffs.filter(b => b.active !== false).length
  const bycat = Object.fromEntries(CATS.map(c => [c, STAT_DEFS.filter(s => s.cat === c)]))

  function startNew() {
    setForm({ name: '', notes: '', bonuses: { ...EMPTY_BONUSES } })
    setEditing('new')
  }

  function startEdit(b) {
    setForm({ name: b.name, notes: b.notes ?? '', bonuses: { ...EMPTY_BONUSES, ...b } })
    setEditing(b.id)
  }

  function save() {
    const hasBonus = STAT_DEFS.some(s => Number(form.bonuses[s.key]) !== 0)
    if (!form.name.trim() && !hasBonus) { setEditing(null); return }
    if (editing === 'new') {
      setActiveBuffs(prev => [...prev, { id: genId(), name: form.name.trim() || 'Buff', notes: form.notes.trim(), active: true, ...form.bonuses }])
    } else {
      setActiveBuffs(prev => prev.map(b => b.id === editing ? { ...b, name: form.name.trim() || b.name, notes: form.notes.trim(), ...form.bonuses } : b))
    }
    setEditing(null)
  }

  function del(id) { setActiveBuffs(prev => prev.filter(b => b.id !== id)) }
  function toggle(id) { setActiveBuffs(prev => prev.map(b => b.id === id ? { ...b, active: b.active === false } : b)) }

  function setBonusField(key, val) {
    setForm(f => ({ ...f, bonuses: { ...f.bonuses, [key]: Number(val) || 0 } }))
  }

  return (
    <div className="bt-panel">
      {!hideTitle && (
        <div className="bt-header" onClick={() => setOpen(o => !o)}>
          <span className="bt-title">{L ? 'Buffs / Effekte' : 'Buffs / Effects'}</span>
          {activeCount > 0 && <span className="bt-active-badge">{activeCount} {L ? 'aktiv' : 'active'}</span>}
          <span className="bt-toggle-icon">{open ? '▴' : '▾'}</span>
        </div>
      )}
      {(hideTitle || open) && (
        <div className="bt-body">
          {buffs.map(b => (
            <div key={b.id} className={`bt-entry ${b.active !== false ? 'bt-entry-active' : ''}`}>
              <button className={`bt-toggle ${b.active !== false ? 'on' : 'off'}`} onClick={() => toggle(b.id)} title={b.active !== false ? (L ? 'Deaktivieren' : 'Deactivate') : (L ? 'Aktivieren' : 'Activate')}>
                {b.active !== false ? '●' : '○'}
              </button>
              <div className="bt-entry-info" onClick={() => startEdit(b)}>
                <span className="bt-entry-name">{b.name}</span>
                {summaryStr(b) && <span className="bt-entry-summary">{summaryStr(b)}</span>}
                {b.notes && <span className="bt-entry-notes">{b.notes}</span>}
              </div>
              <button className="bt-del" onClick={() => del(b.id)} title={L ? 'Löschen' : 'Delete'}>×</button>
            </div>
          ))}
          {buffs.length === 0 && <div className="bt-empty">{L ? 'Keine aktiven Buffs' : 'No active buffs'}</div>}

          {editing !== null ? (
            <div className="bt-form">
              <input
                className="bt-form-name"
                placeholder={L ? 'Name (z.B. Heldenmut, Unsichtbarkeit…)' : 'Name (e.g. Heroism, Invisibility…)'}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
              />
              <input
                className="bt-form-notes"
                placeholder={L ? 'Notiz (optional)' : 'Note (optional)'}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
              <div className="bt-form-cats">
                {CATS.map(cat => (
                  <div key={cat} className="bt-form-cat">
                    <div className="bt-form-cat-label">{CAT_LABELS[cat]}</div>
                    <div className="bt-form-stat-grid">
                      {bycat[cat].map(s => (
                        <label key={s.key} className="bt-form-stat">
                          <span className="bt-form-stat-name">{s.de}</span>
                          <input
                            type="number"
                            className="bt-form-stat-input"
                            value={form.bonuses[s.key] || ''}
                            placeholder="0"
                            onChange={e => setBonusField(s.key, e.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bt-form-actions">
                {editing !== 'new' && (
                  <button className="bt-form-del" onClick={() => { del(editing); setEditing(null) }} title={L ? 'Löschen' : 'Delete'}>🗑</button>
                )}
                <button className="bt-form-cancel" onClick={() => setEditing(null)} title={L ? 'Abbrechen' : 'Cancel'}>✕</button>
                <button className="bt-form-save" onClick={save} disabled={!form.name.trim()} title={L ? 'Speichern' : 'Save'}>✓</button>
              </div>
            </div>
          ) : (
            <button className="bt-add-btn" onClick={startNew}>+ {L ? 'Buff hinzufügen' : 'Add buff'}</button>
          )}
        </div>
      )}
    </div>
  )
}
