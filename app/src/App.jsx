import { useState, useEffect, useRef } from 'react'
import { useCharacters } from './store/useCharacters.js'
import { useHomebrew } from './store/useHomebrew.js'
import { useGistSync } from './store/useGistSync.js'
import racesData from './data/races.json'
import classesData from './data/classes.json'
import { CharacterDrawer } from './components/CharacterDrawer.jsx'
import { GistSyncPanel } from './components/GistSyncPanel.jsx'
import { HomebrewPanel } from './components/HomebrewPanel.jsx'
import { PrintView } from './components/PrintView.jsx'
import { CharacterTab } from './components/CharacterTab.jsx'
import { CombatTab } from './components/CombatTab.jsx'
import { SkillsTab } from './components/SkillsTab.jsx'
import { GearTab } from './components/GearTab.jsx'
import { SpellsTab } from './components/SpellsTab.jsx'
import { NotesTab } from './components/NotesTab.jsx'
import './App.css'

const TABS = [
  { id: 'char',    icon: '👤', label: 'Charakter' },
  { id: 'combat',  icon: '⚔',  label: 'Kampf' },
  { id: 'skills',  icon: '🔨', label: 'Fertigkeiten' },
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

const RACE_MAP = Object.fromEntries(racesData.races.map(r => [r.id, r]))
const CLASS_MAP = Object.fromEntries(classesData.classes.map(c => [c.id, c]))

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
  const [printOpen, setPrintOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [topbarCollapsed, setTopbarCollapsed] = useState(() =>
    localStorage.getItem('sf1_topbar_collapsed') === '1')
  const [navCollapsed, setNavCollapsed] = useState(() =>
    localStorage.getItem('sf1_nav_collapsed') === '1')

  const {
    char, index, activeId, setMeta, update, setAttr, setClass,
    setInventory, setConditions, setNotes, setBio, setFeats, setActiveBuffs,
    setContacts, setSpecials, setXp, setResources,
    newChar, switchChar, deleteChar, importChar,
    getBackupData, reinitialize,
  } = useCharacters(profile)
  const { hb, saveHBItem, deleteHB, reloadHB } = useHomebrew()
  const gistSync = useGistSync(profile)
  const charLevel = char.meta?.classes?.[0]?.id ? (char.meta.classes[0].level || 1) : 0

  // Profilspezifische localStorage-Keys (für die Sync-Effekte unten)
  const CHARS_INDEX_LS = profile === 'gm' ? 'sf1_chars_index_gm' : 'sf1_chars_index'
  const ACTIVE_CHAR_LS = profile === 'gm' ? 'sf1_active_char_gm' : 'sf1_active_char'
  const CHAR_KEY_LS    = id => profile === 'gm' ? `sf1_char_gm_${id}` : `sf1_char_${id}`

  // Auto-Restore vom Gist beim Start, wenn localStorage leer ist (z.B. nach Cache-Löschung)
  useEffect(() => {
    if (!gistSync.connected) return
    const isEmpty = index.length === 1 && !index[0].name && !index[0].race
    if (!isEmpty) return
    gistSync.pull().then(data => {
      if (!data?.index?.length || !data?.chars) return
      for (const [id, charData] of Object.entries(data.chars)) {
        localStorage.setItem(CHAR_KEY_LS(id), JSON.stringify(charData))
      }
      localStorage.setItem(CHARS_INDEX_LS, JSON.stringify(data.index))
      if (data.activeId) localStorage.setItem(ACTIVE_CHAR_LS, data.activeId)
      window.location.reload()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refs, damit der Sync-Handler immer aktuelle Werte sieht (verhindert stale closures)
  const pullRef      = useRef(gistSync.pull)
  const indexRef     = useRef(index)
  const getDataRef   = useRef(getBackupData)
  const pushReadyRef = useRef(false) // erst nach initialem Pull pushen
  useEffect(() => { pullRef.current    = gistSync.pull },  [gistSync.pull])
  useEffect(() => { indexRef.current   = index },          [index])
  useEffect(() => { getDataRef.current = getBackupData },  [getBackupData])

  // Beim Start: erst pullen, dann Push aktivieren (verhindert Überschreiben mit veraltetem lokalem Stand)
  useEffect(() => {
    if (!gistSync.connected) return
    pushReadyRef.current = false
    async function init() {
      const data = await pullRef.current()
      if (data?.index?.length && data?.chars) {
        const remoteMax = Math.max(...data.index.map(e => e.updated ?? 0))
        const localMax  = Math.max(...indexRef.current.map(e => e.updated ?? 0))
        if (remoteMax > localMax) {
          for (const [id, charData] of Object.entries(data.chars)) {
            localStorage.setItem(CHAR_KEY_LS(id), JSON.stringify(charData))
          }
          localStorage.setItem(CHARS_INDEX_LS, JSON.stringify(data.index))
          if (data.homebrew) { localStorage.setItem('sf1_homebrew', JSON.stringify(data.homebrew)); reloadHB() }
          if (data.preferences) {
            for (const [k, v] of Object.entries(data.preferences)) {
              localStorage.setItem(k, JSON.stringify(v))
            }
          }
          reinitialize()
          pushReadyRef.current = true
          return
        }
      }
      pushReadyRef.current = true
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gistSync.connected])

  // Auto-Push zum Gist bei jeder Charakteränderung (debounced, 3s)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (gistSync.connected && pushReadyRef.current) gistSync.schedulePush(getBackupData)
  }, [index])

  // Alle 20s + bei Tab-Fokus prüfen — neu laden, falls Remote-Stand neuer ist
  useEffect(() => {
    if (!gistSync.connected) return
    let reloading = false
    async function checkRemote() {
      if (reloading || !pushReadyRef.current) return
      const data = await pullRef.current()
      if (!data?.index?.length || !data?.chars) return
      const remoteMax = Math.max(...data.index.map(e => e.updated ?? 0))
      const localMax  = Math.max(...indexRef.current.map(e => e.updated ?? 0))
      if (remoteMax <= localMax) return
      reloading = true
      for (const [id, charData] of Object.entries(data.chars)) {
        localStorage.setItem(CHAR_KEY_LS(id), JSON.stringify(charData))
      }
      localStorage.setItem(CHARS_INDEX_LS, JSON.stringify(data.index))
      if (data.homebrew) { localStorage.setItem('sf1_homebrew', JSON.stringify(data.homebrew)); reloadHB() }
      if (data.preferences) {
        for (const [k, v] of Object.entries(data.preferences)) {
          localStorage.setItem(k, JSON.stringify(v))
        }
      }
      reinitialize()
      reloading = false
    }
    const interval = setInterval(checkRemote, 20000)
    function onVisible() { if (document.visibilityState === 'visible') checkRemote() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [gistSync.connected])

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

  function toggleNav() {
    setNavCollapsed(v => {
      const next = !v
      localStorage.setItem('sf1_nav_collapsed', next ? '1' : '0')
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
          <button className="topbar-icon-btn char-list-btn" onClick={() => setDrawerOpen(true)} title={lang === 'de' ? 'Charakterliste' : 'Characters'}>
            ☰
            {index.length > 1 && <span className="char-count-badge">{index.length}</span>}
          </button>
          {charLevel > 0 && (
            <span className="topbar-level">{lang === 'de' ? 'Stufe' : 'Lvl'} {charLevel}</span>
          )}
          <div className="topbar-actions">
            <div className="app-menu-wrap">
              <button className="topbar-icon-btn" onClick={() => setMenuOpen(v => !v)} title={lang === 'de' ? 'Menü' : 'Menu'}>
                ⚙
                {gistSync.connected && (
                  <span className="gist-status-badge"
                    style={{ background: gistSync.status === 'ok' ? '#6ec97e' : gistSync.status === 'error' ? '#c96e6e' : '#c9a96e' }} />
                )}
              </button>
              {menuOpen && (
                <>
                  <div className="app-menu-backdrop" onClick={() => setMenuOpen(false)} />
                  <div className="app-menu" onClick={e => e.stopPropagation()}>
                    <button className="app-menu-item" onClick={() => { exportChar(); setMenuOpen(false) }}>⬇ {lang === 'de' ? 'Exportieren' : 'Export'}</button>
                    <label className="app-menu-item app-menu-import">
                      ⬆ {lang === 'de' ? 'Importieren' : 'Import'}
                      <input type="file" accept="application/json" onChange={e => { handleImportFile(e); setMenuOpen(false) }} hidden />
                    </label>
                    <button className="app-menu-item app-menu-print-btn" onClick={() => { setPrintOpen(true); setMenuOpen(false) }}>🖨 {lang === 'de' ? 'Drucken' : 'Print'}</button>
                    <button className="app-menu-item" onClick={() => { setHbOpen(true); setMenuOpen(false) }}>✦ Homebrew</button>
                    <button className="app-menu-item" onClick={() => { setGistOpen(true); setMenuOpen(false) }}>
                      ☁ Backup{gistSync.connected && <span className="app-menu-sync-indicator" />}
                    </button>
                    <div className="app-menu-divider" />
                    <div className="app-menu-profile-row">
                      <span className="app-menu-profile-label">{lang === 'de' ? 'Profil:' : 'Profile:'}</span>
                      <div className="profile-toggle">
                        <button className={`profile-btn${profile === 'player' ? ' active' : ''}`} onClick={() => { switchProfile('player'); setMenuOpen(false) }}>SP</button>
                        <button className={`profile-btn${profile === 'gm' ? ' active' : ''}`} onClick={() => { switchProfile('gm'); setMenuOpen(false) }}>SL</button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="font-scale-stepper" title={lang === 'de' ? 'Schriftgröße' : 'Font size'}>
              <button className="fss-btn" onClick={fontDown} disabled={fontScale === _SCALES[0]}>−</button>
              <span className="fss-label">Aa</span>
              <button className="fss-btn" onClick={fontUp} disabled={fontScale === _SCALES[_SCALES.length - 1]}>+</button>
            </div>
            <button className="lang-btn" onClick={toggleLang} title={lang === 'de' ? 'Sprache' : 'Language'}>{lang === 'de' ? 'EN' : 'DE'}</button>
            <span className="app-version" title="Build-Version">#{typeof __COMMIT__ !== 'undefined' ? __COMMIT__ : '—'}</span>
            <button className="topbar-icon-btn bar-collapse-btn" onClick={toggleTopbar} title={lang === 'de' ? 'Menü einklappen' : 'Collapse menu'}>−</button>
          </div>
        </div>
        <input
          className="char-name-input"
          placeholder={lang === 'de' ? 'Charaktername' : 'Character name'}
          value={char.meta?.name || ''}
          onChange={e => setMeta('name', e.target.value)}
        />
        <input
          className="player-name-input"
          placeholder={lang === 'de' ? 'Spielende Person' : 'Player'}
          value={char.meta?.player ?? ''}
          onChange={e => setMeta('player', e.target.value)}
        />
      </header>

      <main className="main-scroll">
        {tab === 'char'   && <CharacterTab char={char} setMeta={setMeta} setClass={setClass} setAttr={setAttr} update={update} setBio={setBio} setFeats={setFeats} setXp={setXp} lang={lang} />}
        {tab === 'combat' && <CombatTab char={char} update={update} setConditions={setConditions} setActiveBuffs={setActiveBuffs} setResources={setResources} lang={lang} />}
        {tab === 'skills' && <SkillsTab char={char} update={update} lang={lang} />}
        {tab === 'gear'   && <GearTab char={char} update={update} setInventory={setInventory} lang={lang} />}
        {tab === 'spells' && <SpellsTab char={char} update={update} lang={lang} />}
        {tab === 'ship'   && <PlaceholderTab label="Raumschiff (spätere Phase, siehe STATUS.md)" />}
        {tab === 'notes'  && <NotesTab char={char} setNotes={setNotes} setContacts={setContacts} setSpecials={setSpecials} lang={lang} />}
      </main>

      {navCollapsed && (
        <button className="bar-restore bar-restore-bottom" onClick={toggleNav} title={lang === 'de' ? 'Navigation einblenden' : 'Show navigation'}>▴</button>
      )}
      <nav className={`bottom-nav${navCollapsed ? ' bar-collapsed' : ''}`}>
        {TABS.map(t => (
          <button key={t.id} className={`nav-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)} title={t.label}>
            <span className="nav-icon">{t.icon}</span>
          </button>
        ))}
        <button className="nav-collapse-handle" onClick={toggleNav} title={lang === 'de' ? 'Navigation einklappen' : 'Collapse navigation'}>−</button>
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
          raceMap={RACE_MAP}
          classMap={CLASS_MAP}
        />
      )}
      {hbOpen && <HomebrewPanel hb={hb} saveHBItem={saveHBItem} deleteHB={deleteHB} onClose={() => setHbOpen(false)} lang={lang} />}
      {printOpen && <PrintView char={char} lang={lang} onClose={() => setPrintOpen(false)} />}
      {gistOpen && (
        <GistSyncPanel
          gistSync={gistSync}
          onClose={() => setGistOpen(false)}
          profile={profile}
        />
      )}
    </div>
  )
}
