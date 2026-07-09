import { useState } from 'react'
import { NumberField } from './NumberField.jsx'
import './ResourcesPanel.css'

function genId() { return 'res_' + Math.random().toString(36).slice(2, 9) }

const EMPTY = { id: '', name: '', max: 1, current: 0, unit: '' }

export function ResourcesPanel({ char, setResources, lang, hideTitle = false }) {
  const L = lang === 'de'
  const resources = char.resources ?? []
  const [editId, setEditId] = useState(null)
  const [draft, setDraft] = useState(EMPTY)

  function openNew() {
    setDraft({ ...EMPTY, id: genId() })
    setEditId('__new__')
  }
  function openEdit(r) { setDraft({ ...r }); setEditId(r.id) }
  function cancel() { setEditId(null) }

  function save() {
    if (!draft.name.trim()) return
    setResources(prev => {
      if (editId === '__new__') return [...prev, draft]
      return prev.map(r => r.id === editId ? draft : r)
    })
    setEditId(null)
  }

  function del(id) {
    setResources(prev => prev.filter(r => r.id !== id))
    if (editId === id) setEditId(null)
  }

  function use(id) {
    setResources(prev => prev.map(r =>
      r.id === id ? { ...r, current: Math.min(r.max, r.current + 1) } : r
    ))
  }
  function restore(id) {
    setResources(prev => prev.map(r =>
      r.id === id ? { ...r, current: 0 } : r
    ))
  }
  function restoreAll() {
    setResources(prev => prev.map(r => ({ ...r, current: 0 })))
  }

  const anyUsed = resources.some(r => r.current > 0)

  return (
    <div className="res-panel">
      <div className="res-header">
        {!hideTitle && <h3 className="ct-heading">{L ? 'Ressourcen' : 'Resources'}</h3>}
        {anyUsed && (
          <button className="res-reset-all-btn" onClick={restoreAll}>
            ↺ {L ? 'Alle zurücksetzen' : 'Reset all'}
          </button>
        )}
      </div>

      {/* Edit / new form */}
      {editId && (
        <div className="res-form">
          <input
            className="res-form-name"
            placeholder={L ? 'Fähigkeit (z.B. Kampfrausch, Trick)' : 'Ability name'}
            value={draft.name}
            onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
            autoFocus
          />
          <div className="res-form-row">
            <label className="res-form-label">{L ? 'Max' : 'Max'}</label>
            <NumberField
              className="res-form-max"
              min={1} max={999}
              value={draft.max}
              onCommit={v => setDraft(d => ({ ...d, max: v }))}
            />
            <input
              className="res-form-unit"
              type="text"
              placeholder={L ? 'Einheit (Runden…)' : 'Unit (rounds…)'}
              value={draft.unit ?? ''}
              onChange={e => setDraft(d => ({ ...d, unit: e.target.value }))}
            />
          </div>
          <div className="res-form-actions">
            {editId !== '__new__' && (
              <button className="res-del-btn" onClick={() => del(editId)} title={L ? 'Löschen' : 'Delete'}>🗑</button>
            )}
            <button className="res-cancel-btn" onClick={cancel} title={L ? 'Abbrechen' : 'Cancel'}>✕</button>
            <button className="res-save-btn" onClick={save} disabled={!draft.name.trim()} title={L ? 'Speichern' : 'Save'}>✓</button>
          </div>
        </div>
      )}

      {/* Resources list */}
      {resources.length === 0 && !editId && (
        <p className="res-empty">{L
          ? 'Keine Ressourcen — z.B. Kampfrausch, Agententrick, Solarier-Offenbarung…'
          : 'No resources — e.g. class tricks, revelations, per-day abilities…'
        }</p>
      )}

      <div className="res-list">
        {resources.map(r => {
          const remaining = r.max - r.current
          const pct = r.max > 0 ? remaining / r.max : 1
          return (
            <div key={r.id} className={`res-row ${editId === r.id ? 'editing' : ''}`}>
              <div className="res-row-main">
                <span className="res-name" onClick={() => editId !== r.id && openEdit(r)}>{r.name}</span>
                <div className="res-controls">
                  <button className="res-use-btn" onClick={() => use(r.id)} disabled={remaining <= 0}
                    title={L ? 'Verwenden' : 'Use'}>−</button>
                  <span className="res-counter"
                    style={{ color: pct > 0.5 ? 'var(--good)' : pct > 0 ? '#c9a96e' : '#c96e6e' }}>
                    {remaining}/{r.max}{r.unit ? ` ${r.unit}` : ''}
                  </span>
                  <button className="res-restore-btn" onClick={() => restore(r.id)} disabled={r.current === 0}
                    title={L ? 'Zurücksetzen' : 'Reset'}>↺</button>
                </div>
              </div>
              <div className="res-bar-wrap">
                <div className="res-bar"
                  style={{ width: `${pct * 100}%`,
                    background: pct > 0.5 ? 'var(--good)' : pct > 0 ? '#c9a96e' : '#c96e6e' }} />
              </div>
            </div>
          )
        })}
      </div>

      {!editId && (
        <button className="res-add-btn" onClick={openNew}>
          + {L ? 'Ressource hinzufügen' : 'Add resource'}
        </button>
      )}
    </div>
  )
}
