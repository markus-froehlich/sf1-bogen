import { useState } from 'react'
import { NumberField } from './NumberField.jsx'
import './BuffTracker.css'

const EMPTY = { name: '', ST: 0, GE: 0, KO: 0, IN: 0, WE: 0, CH: 0, attack: 0, eac: 0, kac: 0, saveRef: 0, saveWill: 0, saveZah: 0 }

const FIELD_LABELS = [
  ['ST', 'ST'], ['GE', 'GE'], ['KO', 'KO'], ['IN', 'IN'], ['WE', 'WE'], ['CH', 'CH'],
  ['attack', 'Angriff'], ['eac', 'EAC'], ['kac', 'KAC'],
  ['saveRef', 'Reflex'], ['saveWill', 'Wille'], ['saveZah', 'Zähigkeit'],
]

function genId() { return 'buff_' + Math.random().toString(36).slice(2, 9) }

function summarize(buff, L) {
  const parts = FIELD_LABELS
    .filter(([key]) => Number(buff[key]))
    .map(([key, label]) => `${Number(buff[key]) >= 0 ? '+' : ''}${buff[key]} ${label}`)
  return parts.length ? parts.join(', ') : (L ? '(keine Boni)' : '(no bonuses)')
}

export function BuffTracker({ char, setActiveBuffs, lang, hideTitle = false }) {
  const L = lang === 'de'
  const buffs = char.active_buffs ?? []
  const [draft, setDraft] = useState(null)

  function openNew() {
    setDraft({ ...EMPTY })
  }
  function cancelDraft() {
    setDraft(null)
  }
  function saveDraft() {
    if (!draft?.name?.trim()) return
    setActiveBuffs(prev => [...prev, { id: genId(), active: true, ...draft }])
    setDraft(null)
  }
  function setField(key, value) {
    setDraft(d => ({ ...d, [key]: key === 'name' ? value : Number(value) || 0 }))
  }
  function toggleActive(id) {
    setActiveBuffs(prev => prev.map(b => b.id === id ? { ...b, active: b.active === false } : b))
  }
  function removeBuff(id) {
    setActiveBuffs(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div>
      {!hideTitle && <h3 className="section-title">{L ? 'Buffs' : 'Buffs'}</h3>}
      <p className="char-hint">{L
        ? 'Aktive Buffs fließen automatisch in Attribute, EAC/KAC, Angriffsbonus und Rettungswürfe ein.'
        : 'Active buffs automatically apply to attributes, EAC/KAC, attack bonus and saves.'}</p>

      <div className="buff-list">
        {buffs.length === 0 && <p className="char-hint">{L ? 'Noch keine Buffs.' : 'No buffs yet.'}</p>}
        {buffs.map(b => (
          <div key={b.id} className={`buff-row ${b.active === false ? 'inactive' : ''}`}>
            <button className="buff-toggle" onClick={() => toggleActive(b.id)} title={L ? 'Ein-/Ausschalten' : 'Toggle'}>
              {b.active === false ? '☐' : '☑'}
            </button>
            <div className="buff-info">
              <span className="buff-name">{b.name}</span>
              <span className="buff-mods">{summarize(b, L)}</span>
            </div>
            <button className="buff-del-btn" onClick={() => removeBuff(b.id)} title={L ? 'Löschen' : 'Delete'}>🗑</button>
          </div>
        ))}
      </div>

      {draft ? (
        <div className="buff-form">
          <input
            className="bio-input"
            placeholder={L ? 'Name des Buffs' : 'Buff name'}
            value={draft.name}
            onChange={e => setField('name', e.target.value)}
            autoFocus
          />
          <div className="buff-form-grid">
            {FIELD_LABELS.map(([key, label]) => (
              <label key={key} className="buff-form-field">
                <span>{label}</span>
                <NumberField value={draft[key]} onCommit={v => setField(key, v)} />
              </label>
            ))}
          </div>
          <div className="buff-form-actions">
            <button className="buff-cancel-btn" onClick={cancelDraft} title={L ? 'Abbrechen' : 'Cancel'}>✕</button>
            <button className="buff-save-btn" onClick={saveDraft} disabled={!draft.name.trim()} title={L ? 'Speichern' : 'Save'}>✓</button>
          </div>
        </div>
      ) : (
        <button className="buff-add-btn" onClick={openNew}>+ {L ? 'Neuer Buff' : 'New buff'}</button>
      )}
    </div>
  )
}
