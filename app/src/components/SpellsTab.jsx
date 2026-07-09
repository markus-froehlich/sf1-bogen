import { useMemo, useState } from 'react'
import spellsData from '../data/spells.json'
import spellDescriptions from '../data/spell_descriptions.json'
import { computeCharacterStats } from '../engine/characterStats.js'
import './SpellsTab.css'

const GRADES = ['grad0', 'grad1', 'grad2', 'grad3', 'grad4', 'grad5', 'grad6']

const SPELLS_BY_GRADE = (() => {
  const byGrade = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
  for (const sp of spellDescriptions.spells) {
    const g = Number(sp.grad)
    if (Number.isInteger(g) && byGrade[g]) byGrade[g].push(sp)
    else if (Number.isInteger(g) && g in byGrade) byGrade[g].push(sp)
  }
  for (const g of Object.keys(byGrade)) byGrade[g].sort((a, b) => a.name.localeCompare(b.name, 'de'))
  return byGrade
})()

export function SpellsTab({ char, update, lang }) {
  const L = lang === 'de'
  const stats = useMemo(() => computeCharacterStats(char), [char])
  const { klass, level, classEntry } = stats
  const [mode, setMode] = useState('book')
  const [openGrade, setOpenGrade] = useState('grad0')
  const [lookupGrade, setLookupGrade] = useState(0)
  const [query, setQuery] = useState('')

  const isCaster = !!klass?.is_spellcaster

  const modeToggle = (
    <div className="spell-mode-toggle">
      <button className={`spell-mode-btn ${mode === 'book' ? 'active' : ''}`} onClick={() => setMode('book')} disabled={!isCaster}>
        📖 {L ? 'Zauberbuch' : 'Spellbook'}
      </button>
      <button className={`spell-mode-btn ${mode === 'lookup' ? 'active' : ''}`} onClick={() => setMode('lookup')}>
        🔍 {L ? 'Nachschlagen' : 'Lookup'}
      </button>
    </div>
  )

  if (mode === 'lookup') {
    const list = SPELLS_BY_GRADE[lookupGrade].filter(sp =>
      !query.trim() || sp.name.toLowerCase().includes(query.trim().toLowerCase()))
    return (
      <div className="section spells-tab">
        {modeToggle}
        <section>
          <h3 className="section-title">{L ? 'Zauber nachschlagen' : 'Look up spells'}</h3>
          <p className="char-hint">{L
            ? 'Komplette Zauberliste (Aspirant + Technomagier), unabhängig vom eigenen Zauberbuch.'
            : 'Full spell list (Aspirant + Technomancer), independent of your own spellbook.'}</p>
          <div className="spell-grade-tabs">
            {[0, 1, 2, 3, 4, 5, 6].map(g => (
              <button key={g} className={`spell-grade-tab ${lookupGrade === g ? 'active' : ''}`} onClick={() => setLookupGrade(g)}>
                {g} ({SPELLS_BY_GRADE[g].length})
              </button>
            ))}
          </div>
          <input
            className="bio-input spell-lookup-search"
            placeholder={L ? 'Zauber suchen…' : 'Search spells…'}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="spell-lookup-list">
            {list.length === 0 && <p className="char-hint">{L ? 'Keine Treffer.' : 'No matches.'}</p>}
            {list.map(sp => (
              <div key={sp.name} className="spell-lookup-item">
                <span className="spell-item-name">{sp.name}</span>
                <span className="spell-lookup-meta">
                  {[sp.schule, sp.zeitaufwand, sp.reichweite].filter(Boolean).join(' · ')}
                </span>
                <p className="spell-item-desc">{sp.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    )
  }

  if (!isCaster) {
    return (
      <div className="section spells-tab">
        {modeToggle}
        <section>
          <p className="char-hint">
            {L ? 'Die gewählte Klasse wirkt keine Zauber. Nur Aspirant und Technomagier haben Zauberlisten.'
               : 'The selected class does not cast spells. Only Aspirant and Technomancer have spell lists.'}
          </p>
        </section>
      </div>
    )
  }

  const spellList = classEntry.id === 'aspirant' ? spellsData.aspirant_spells : spellsData.technomancer_spells
  const levelRow = klass.levels.find(l => l.level === level) || klass.levels[klass.levels.length - 1]
  const perDay = levelRow?.spells_per_day || {}

  const known = char.spells_known?.[classEntry.id] || {}

  function toggleSpell(grade, name) {
    const current = known[grade] || []
    const next = current.includes(name) ? current.filter(n => n !== name) : [...current, name]
    update({ spells_known: { [classEntry.id]: { [grade]: next } } })
  }

  return (
    <div className="section spells-tab">
      {modeToggle}
      <section>
        <h3 className="section-title">{L ? 'Zauberplätze pro Tag' : 'Spells per day'}</h3>
        <div className="spell-slots-row">
          {GRADES.map((g, i) => {
            const val = g === 'grad0' ? perDay.grad0 : perDay[g]
            if (val == null && i > 0) return null
            return (
              <div key={g} className="spell-slot-box">
                <span className="spell-slot-grade">{i}</span>
                <span className="spell-slot-count">{val ?? (i === 0 ? '∞' : '—')}</span>
              </div>
            )
          })}
        </div>
        <p className="char-hint">{spellsData.general_spellcasting_rules}</p>
      </section>

      <section>
        <h3 className="section-title">{L ? 'Bekannte Zauber' : 'Known spells'}</h3>
        <div className="spell-grade-tabs">
          {GRADES.map((g, i) => (
            <button key={g} className={`spell-grade-tab ${openGrade === g ? 'active' : ''}`} onClick={() => setOpenGrade(g)}>
              {i}{known[g]?.length ? ` (${known[g].length})` : ''}
            </button>
          ))}
        </div>
        <div className="spell-list">
          {(spellList[openGrade] || []).map(sp => {
            const isKnown = (known[openGrade] || []).includes(sp.name)
            return (
              <button key={sp.name} className={`spell-item ${isKnown ? 'known' : ''}`} onClick={() => toggleSpell(openGrade, sp.name)}>
                <span className="spell-item-name">{sp.name}</span>
                <span className="spell-item-desc">{sp.description}</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
