import { useMemo, useState } from 'react'
import spellsData from '../data/spells.json'
import { computeCharacterStats } from '../engine/characterStats.js'
import './SpellsTab.css'

const GRADES = ['grad0', 'grad1', 'grad2', 'grad3', 'grad4', 'grad5', 'grad6']

export function SpellsTab({ char, update, lang }) {
  const L = lang === 'de'
  const stats = useMemo(() => computeCharacterStats(char), [char])
  const { klass, level, classEntry } = stats
  const [openGrade, setOpenGrade] = useState('grad0')

  if (!klass?.is_spellcaster) {
    return (
      <div className="section spells-tab">
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
