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

const _SCALES = ['s', 'm', 'l', 'xl']
const _initScale = localStorage.getItem('sf1_font_scale') ?? 'm'
if (_initScale !== 'm') document.documentElement.classList.add(`fs-${_initScale}`)

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('sf1_lang') ?? 'de')
  const [fontScale, setFontScale] = useState(_initScale)
  const [profile, setProfile] = useState(() => localStorage.getItem('sf1_profile') ?? 'player')
  const [tab, setTab] = useState('char')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [hbOpen, setHbOpen] = useState(false)
  const [gistOpen, setGistOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [topbarCollapsed, setTopbarCollapsed] = useState(() =>
    localStorage.getItem('sf1_topbar_collapsed') === '1')

  const {
    char, index, activeId, setMeta, update, setAttr, setClass,
    setInventory, setConditions, setNotes,
    newChar, switchChar, deleteChar, importChar,
  } = useCharacters(profile)
  const { hb, saveHBItem, deleteHB } = useHomebrew()
  const gistSync = useGistSync(profile)

  function applyFont(scale) {
    localStorage.setItem('sf1_font_scale', scale)
    document.documentElement.classList.remove('fs-s', 'fs-l', 'fs-xl')
    if (scale !== 'm') document.documentElement.classList.add(`fs-${scale}`)
    setFontScale(scale)
  }
  function fontDown() { const i = _SCALES.indexOf(fontScale); if (i > 0) applyFont(_SCALES[i - 1]) }
  function fontUp()   { const i = _SCALES.indexOf(fontScale); if (i < _SCALES.length - 1) applyFont(_SCALES[i + 1]) }

  function toggleLang() {
    const next = lang === 'de' ? 'en' : 'de'
    localStorage.setItem('sf1_lang', next)
    setLang(next)
  }

  function toggleTopbar() {
    setTopbarCollapsed(v => {
      const next = !v
      localStorage.setItem('sf1_topbar_collapsed', next ? '1' : '0')
      return next
    })
  }

  function switchProfile(p) {
    setProfile(p)
    localStorage.setItem('sf1_profile', p)
    window.location.reload()
  }

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
      {topbarCollapsed && (
        <button className="bar-restore bar-restore-top" onClick={toggleTopbar} title={lang === 'de' ? 'Menü einblenden' : 'Show menu'}>▾</button>
      )}
      <header className={`topbar${topbarCollapsed ? ' bar-collapsed' : ''}`}>
        <div className="topbar-row1">
          <button className="topbar-icon-btn" onClick={() => setDrawerOpen(true)} title={lang === 'de' ? 'Charaktere' : 'Characters'}>☰</button>
          <input
            className="char-name-input"
            placeholder={lang === 'de' ? 'Charaktername' : 'Character name'}
            value={char.meta?.name || ''}
            onChange={e => setMeta('name', e.target.value)}
          />
          <div className="topbar-actions">
            <button className="topbar-icon-btn bar-collapse-btn" onClick={toggleTopbar} title={lang === 'de' ? 'Menü einklappen' : 'Collapse menu'}>−</button>
            <button className="topbar-icon-btn" onClick={() => setMenuOpen(v => !v)} title={lang === 'de' ? 'Menü' : 'Menu'}>⚙</button>
          </div>
        </div>
        <div className="topbar-row2">
          <div className="profile-toggle">
            <button className={`profile-btn${profile === 'player' ? ' active' : ''}`} onClick={() => switchProfile('player')}>SP</button>
            <button className={`profile-btn${profile === 'gm' ? ' active' : ''}`} onClick={() => switchProfile('gm')}>SL</button>
          </div>
          <div className="font-scale-stepper" title={lang === 'de' ? 'Schriftgröße' : 'Font size'}>
            <button className="fss-btn" onClick={fontDown} disabled={fontScale === _SCALES[0]}>−</button>
            <span className="fss-label">Aa</span>
            <button className="fss-btn" onClick={fontUp} disabled={fontScale === _SCALES[_SCALES.length - 1]}>+</button>
          </div>
          <button className="lang-btn" onClick={toggleLang} title={lang === 'de' ? 'Sprache' : 'Language'}>{lang === 'de' ? 'EN' : 'DE'}</button>
        </div>
        {menuOpen && (
          <div className="app-menu">
            <button onClick={exportChar}>⬇ {lang === 'de' ? 'Export' : 'Export'}</button>
            <label className="app-menu-import">
              ⬆ {lang === 'de' ? 'Import' : 'Import'}
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
