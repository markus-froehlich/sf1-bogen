import { useState } from 'react'
import './NotesTab.css'

const MODES = [
  { id: 'notes',    icon: '📜', de: 'Notizen',          en: 'Notes' },
  { id: 'contacts', icon: '👥', de: 'Kontakte',          en: 'Contacts' },
  { id: 'specials', icon: '⚡', de: 'Sonderfähigkeiten', en: 'Special abilities' },
]

function genId() { return 'e_' + Math.random().toString(36).slice(2, 9) }

function EntryList({ items, setItems, lang, placeholderName, placeholderNotes }) {
  const L = lang === 'de'
  const [draft, setDraft] = useState(null)

  function openNew() { setDraft({ name: '', notes: '' }) }
  function cancelDraft() { setDraft(null) }
  function saveDraft() {
    if (!draft?.name?.trim()) return
    setItems(prev => [...prev, { id: genId(), ...draft }])
    setDraft(null)
  }
  function removeItem(id) { setItems(prev => prev.filter(it => it.id !== id)) }

  return (
    <div className="entry-list">
      {items.length === 0 && !draft && <p className="char-hint">{L ? 'Noch keine Einträge.' : 'No entries yet.'}</p>}
      {items.map(it => (
        <div key={it.id} className="entry-row">
          <div className="entry-row-head">
            <span className="entry-name">{it.name}</span>
            <button className="entry-del-btn" onClick={() => removeItem(it.id)} title={L ? 'Löschen' : 'Delete'}>🗑</button>
          </div>
          {it.notes && <p className="entry-notes">{it.notes}</p>}
        </div>
      ))}

      {draft ? (
        <div className="entry-form">
          <input
            className="bio-input"
            placeholder={placeholderName}
            value={draft.name}
            onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
            autoFocus
          />
          <textarea
            className="entry-notes-input"
            placeholder={placeholderNotes}
            value={draft.notes}
            onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
          />
          <div className="entry-form-actions">
            <button className="entry-cancel-btn" onClick={cancelDraft} title={L ? 'Abbrechen' : 'Cancel'}>✕</button>
            <button className="entry-save-btn" onClick={saveDraft} disabled={!draft.name.trim()} title={L ? 'Speichern' : 'Save'}>✓</button>
          </div>
        </div>
      ) : (
        <button className="entry-add-btn" onClick={openNew}>+ {L ? 'Neuer Eintrag' : 'New entry'}</button>
      )}
    </div>
  )
}

export function NotesTab({ char, setNotes, setContacts, setSpecials, lang }) {
  const L = lang === 'de'
  const [mode, setMode] = useState('notes')

  return (
    <div className="section notes-tab">
      <div className="notes-mode-row">
        {MODES.map(m => (
          <button key={m.id} className={`notes-mode-btn ${mode === m.id ? 'active' : ''}`} onClick={() => setMode(m.id)}>
            {m.icon} {L ? m.de : m.en}
          </button>
        ))}
      </div>

      {mode === 'notes' && (
        <textarea
          className="notes-textarea"
          placeholder={L ? 'Notizen …' : 'Notes …'}
          value={char.notes ?? ''}
          onChange={e => setNotes(e.target.value)}
        />
      )}
      {mode === 'contacts' && (
        <EntryList
          items={char.contacts ?? []}
          setItems={setContacts}
          lang={lang}
          placeholderName={L ? 'Name des NSCs' : 'NPC name'}
          placeholderNotes={L ? 'Rolle, Fundort, Beziehung …' : 'Role, whereabouts, relationship …'}
        />
      )}
      {mode === 'specials' && (
        <EntryList
          items={char.specials ?? []}
          setItems={setSpecials}
          lang={lang}
          placeholderName={L ? 'Name der Fähigkeit' : 'Ability name'}
          placeholderNotes={L ? 'Wirkung, Quelle (Augmentierung/Cyberware/Ausrüstung) …' : 'Effect, source (augmentation/cyberware/gear) …'}
        />
      )}
    </div>
  )
}
