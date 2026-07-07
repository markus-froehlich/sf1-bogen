import { useState } from 'react'
import { useCharacters } from './store/useCharacters.js'
import { useHomebrew } from './store/useHomebrew.js'
import { useGistSync } from './store/useGistSync.js'
import { CharacterDrawer } from './components/CharacterDrawer.jsx'
import { GistSyncPanel } from './components/GistSyncPanel.jsx'
import { HomebrewPanel } from './components/HomebrewPanel.jsx'
import { CharacterTab } from './components/CharacterTab.jsx'
import { CombatTab } from './components/CombatTab.jsx'
import { GearTab } from './components/GearTab.jsx'
import { SpellsTab } from './components/SpellsTab.jsx'
import './App.css'

const TABS = [
  { id: 'char',    icon: '👤', label: 'Charakter' },
  { id: 'combat',  icon: '⚔',  label: 'Kampf' },
  { id: 'gear',    icon: '🔫', label: 'Ausrüstung' },
  { id: 'spells',  icon: '✨', label: 'Zauber' },
  { id: 'ship',    icon: '🚀', label: 'Raumschiff' },
  { id: 'notes',   icon: '📜', label: 'Notizen' },
]

// Raumschiffe sind explizit zurückgestellt (siehe AGENTS.md/STATUS.md) - kein
// Datenkapitel dazu extrahiert, daher bleibt dieser Tab bewusst ein Platzhalter.
function PlaceholderTab({ label }) {
  return (
    <div className="placeholder-tab">
      <p>{label}</p>
      <p className="placeholder-hint">Noch nicht gebaut — siehe STATUS.md, „Nächste Schritte".</p>
    </div>
  )
}

export default function App() {
  const [lang] = useState('de')
  const [tab, setTab] = useState('char')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [hbOpen, setHbOpen] = useState(false)
  const [gistOpen, setGistOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const {
    char, index, activeId, setMeta, update, setAttr, setClass,
    setInventory, setConditions, setNotes,
    newChar, switchChar, deleteChar, importChar,
  } = useCharacters('player')
  const { hb, saveHBItem, deleteHB } = useHomebrew()
  const gistSync = useGistSync('player')

  function exportChar() {
    const blob = new Blob([JSON.stringify(char, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${char.meta?.name || 'charakter'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try { importChar(JSON.parse(reader.result)) }
      catch { alert('Datei konnte nicht gelesen werden.') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-row1">
          <button className="topbar-icon-btn" onClick={() => setDrawerOpen(true)} title="Charaktere">☰</button>
          <input
            className="char-name-input"
            placeholder="Charaktername"
            value={char.meta?.name || ''}
            onChange={e => setMeta('name', e.target.value)}
          />
          <div className="topbar-actions">
            <button className="topbar-icon-btn" onClick={() => setMenuOpen(v => !v)} title="Menü">⚙</button>
          </div>
        </div>
        {menuOpen && (
          <div className="app-menu">
            <button onClick={exportChar}>⬇ Export</button>
            <label className="app-menu-import">
              ⬆ Import
              <input type="file" accept="application/json" onChange={handleImportFile} hidden />
            </label>
            <button onClick={() => { setHbOpen(true); setMenuOpen(false) }}>⚙ Homebrew</button>
            <button onClick={() => { setGistOpen(true); setMenuOpen(false) }}>☁ Backup</button>
          </div>
        )}
      </header>

      <main className="main-scroll">
        {tab === 'char'   && <CharacterTab char={char} setMeta={setMeta} setClass={setClass} setAttr={setAttr} update={update} lang={lang} />}
        {tab === 'combat' && <CombatTab char={char} setConditions={setConditions} lang={lang} />}
        {tab === 'gear'   && <GearTab char={char} update={update} setInventory={setInventory} lang={lang} />}
        {tab === 'spells' && <SpellsTab char={char} update={update} lang={lang} />}
        {tab === 'ship'   && <PlaceholderTab label="Raumschiff (spätere Phase, siehe STATUS.md)" />}
        {tab === 'notes'  && (
          <textarea
            className="notes-textarea"
            placeholder="Notizen …"
            value={char.notes ?? ''}
            onChange={e => setNotes(e.target.value)}
          />
        )}
      </main>

      <nav className="bottom-nav">
        {TABS.map(t => (
          <button key={t.id} className={`nav-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)} title={t.label}>
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-label">{t.label}</span>
          </button>
        ))}
      </nav>

      {drawerOpen && (
        <CharacterDrawer
          index={index}
          activeId={activeId}
          onSwitch={id => { switchChar(id); setDrawerOpen(false) }}
          onNew={() => { newChar(); setDrawerOpen(false) }}
          onDelete={deleteChar}
          onClose={() => setDrawerOpen(false)}
          lang={lang}
        />
      )}
      {hbOpen && <HomebrewPanel hb={hb} saveHBItem={saveHBItem} deleteHB={deleteHB} onClose={() => setHbOpen(false)} lang={lang} />}
      {gistOpen && (
        <GistSyncPanel
          gistSync={gistSync}
          onClose={() => setGistOpen(false)}
          profile="player"
        />
      )}
    </div>
  )
}
