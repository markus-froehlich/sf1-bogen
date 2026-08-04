import { useMemo, useState } from 'react'
import racesData from '../data/races.json'
import classesData from '../data/classes.json'
import { AttributeBlock } from './AttributeBlock.jsx'
import { BioSection } from './BioSection.jsx'
import { XpTracker } from './XpTracker.jsx'
import { NumberField } from './NumberField.jsx'
import { useSectionOrder } from '../store/useSectionOrder.js'
import { computeCharacterStats } from '../engine/characterStats.js'
import { getHBRaces, getHBClasses } from '../engine/homebrew.js'
import './CharacterTab.css'

const CHAR_SECTIONS_DEFAULT = ['volk_klasse', 'xp', 'bio', 'attribute', 'volksmerkmale', 'klassenmerkmale']

function useCollapsed(storageKey) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(storageKey) ?? '[]')) }
    catch { return new Set() }
  })
  function toggle(id) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      localStorage.setItem(storageKey, JSON.stringify([...next]))
      return next
    })
  }
  return [collapsed, toggle]
}

export function CharacterTab({ char, setMeta, setClass, setAttr, update, setBio, setXp, lang }) {
  const L = lang === 'de'
  const stats = useMemo(() => computeCharacterStats(char), [char])
  const { race, klass, level, abilityMods, buffTags, condTags, classEntries, classContribs, isMulticlass } = stats

  const [order, moveSection] = useSectionOrder('sf1_attr_order', CHAR_SECTIONS_DEFAULT)
  const [collapsed, toggleCollapsed] = useCollapsed('sf1_attr_collapsed')

  const classEntry = char.meta?.classes?.[0] || { id: '', level: 1 }

  // Multiclassing (Kapitel 2, S. 27): mehrere Klasse+Stufe-Einträge statt
  // einem - Notation wie im Regelwerk-Beispiel "Soldat 5/Technomagier 1".
  function addClassEntry() {
    update({ meta: { classes: [...classEntries, { id: '', level: 1 }] } })
  }
  function removeClassEntry(idx) {
    update({ meta: { classes: classEntries.filter((_, i) => i !== idx) } })
  }

  const classSummary = classContribs.length > 0
    ? classContribs.map(c => `${c.klass.name.de} ${c.level}`).join('/')
    : null

  const HEADINGS = {
    volk_klasse: L ? 'Volk & Klasse' : 'Race & Class',
    xp: L ? 'Erfahrung' : 'Experience',
    bio: L ? 'Bio' : 'Bio',
    attribute: L ? 'Attribute' : 'Attributes',
    volksmerkmale: L ? 'Volksmerkmale' : 'Racial traits',
    klassenmerkmale: L ? 'Klassenmerkmale' : 'Class features',
  }

  // Eingeklappte Abschnitte zeigen die Kernwerte statt einer leeren
  // Überschrift (wie pf1-bogen). Volk & Klasse sind in SF1e eine
  // gemeinsame Sektion, daher hier zusammengefasst statt zwei Zeilen.
  const SUMMARIES = {
    volk_klasse: [race?.name?.de, classSummary].filter(Boolean).join(' · '),
    xp: `${char.xp?.current ?? 0} EP`,
  }

  const BODIES = {
    volk_klasse: () => (
      <>
        <div className="bio-field">
          <label className="bio-label">{L ? 'Volk' : 'Race'}</label>
          <select className="bio-select" value={char.meta?.race || ''} onChange={e => setMeta('race', e.target.value)}>
            <option value="">—</option>
            {racesData.races.map(r => (
              <option key={r.id} value={r.id}>{r.name.de}</option>
            ))}
            {getHBRaces().length > 0 && (
              <optgroup label="Homebrew">
                {getHBRaces().map(r => <option key={r.id} value={r.id}>{r.name?.de}</option>)}
              </optgroup>
            )}
          </select>
        </div>

        {classEntries.map((entry, idx) => {
          const entryClass = classesData.classes.find(c => c.id === entry.id) || getHBClasses().find(c => c.id === entry.id) || null
          return (
            <div key={idx} className="class-entry-row">
              <div className="class-entry-fields">
                <div className="bio-field">
                  <label className="bio-label">{idx === 0 ? (L ? 'Klasse' : 'Class') : (L ? `Klasse ${idx + 1}` : `Class ${idx + 1}`)}</label>
                  <select className="bio-select" value={entry.id} onChange={e => setClass(idx, 'id', e.target.value)}>
                    <option value="">—</option>
                    {classesData.classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name.de}</option>
                    ))}
                    {getHBClasses().length > 0 && (
                      <optgroup label="Homebrew">
                        {getHBClasses().map(c => <option key={c.id} value={c.id}>{c.name?.de}</option>)}
                      </optgroup>
                    )}
                  </select>
                </div>
                <div className="bio-field class-entry-level">
                  <label className="bio-label">{L ? 'Stufe' : 'Level'}</label>
                  <NumberField className="bio-input bio-input-num" min={1} max={20}
                    value={entry.level} onCommit={v => setClass(idx, 'level', v)} />
                </div>
                {classEntries.length > 1 && (
                  <button className="class-entry-remove" onClick={() => removeClassEntry(idx)} title={L ? 'Klasse entfernen' : 'Remove class'}>×</button>
                )}
              </div>
              {entryClass && idx === 0 && <p className="char-hint">{L ? 'Schlüsselattribut' : 'Key ability'}: {entryClass.key_ability} — {entryClass.key_ability_note}</p>}
            </div>
          )
        })}
        <button className="class-entry-add" onClick={addClassEntry}>+ {L ? 'Zusätzliche Klasse (Multiclassing)' : 'Additional class (multiclassing)'}</button>

        {race && <p className="char-hint">{race.ability_mods_text} · {race.hp_bonus} TP · {race.size} · {race.creature_type}</p>}
        {isMulticlass && (
          <p className="char-hint">
            {L ? `Charakterstufe ${level} (${classSummary}). GAB/Rettungswürfe/TP/AP addieren sich aus den Stufen jeder Klasse; Reservepunkte nutzen das Schlüsselattribut der ersten Klasse.`
               : `Character level ${level} (${classSummary}). BAB/saves/HP/SP sum across each class's own level; Resolve Points use the first class's key ability.`}
          </p>
        )}
      </>
    ),
    xp: () => <XpTracker char={char} setXp={setXp} totalLevel={level} lang={lang} />,
    bio: () => <BioSection char={char} setBio={setBio} lang={lang} />,
    attribute: () => (
      <>
        <p className="attr-note">{L
          ? 'Trage den fertigen Wert ein (Volksmodifikatoren bereits eingerechnet, siehe races.json).'
          : 'Enter the final score (racial modifiers already included).'}</p>
        <div className="attr-grid">
          {['ST', 'GE', 'KO', 'IN', 'WE', 'CH'].map(k => (
            <AttributeBlock
              key={k}
              attrKey={k}
              lang={lang}
              computed={{
                score: char.attributes?.[k] ?? 10,
                mod: abilityMods[k],
                buffSources: buffTags[k],
                condSources: condTags[k],
              }}
              onScoreChange={(attr, v) => setAttr(attr, v)}
            />
          ))}
        </div>
      </>
    ),
    volksmerkmale: () => race && (
      <div className="feature-list">
        {(race.traits ?? []).map(t => (
          <div key={t.name} className="feature-item">
            <span className="feature-name">{t.name}</span>
            <p className="feature-desc">{t.description}</p>
          </div>
        ))}
      </div>
    ),
    klassenmerkmale: () => klass && (
      <>
        {classContribs.map(c => (
          <div key={c.klass.id} className="feature-list">
            {isMulticlass && <h4 className="feature-class-heading">{c.klass.name.de}</h4>}
            {c.klass.features.filter(f => f.level_gained <= c.level).map(f => (
              <div key={f.name} className="feature-item">
                <span className="feature-name">{f.name} <span className="feature-level">({L ? 'Stufe' : 'Level'} {f.level_gained})</span></span>
                <p className="feature-desc">{f.description}</p>
              </div>
            ))}
            {c.klass.notes && <p className="char-hint">{c.klass.notes}</p>}
          </div>
        ))}
      </>
    ),
  }

  // Abschnitte, die ohne Volk/Klasse nichts anzuzeigen hätten, werden
  // übersprungen; "talente" ist aus gespeicherter Reihenfolge älterer
  // Charaktere entfernt (jetzt eigener Bottom-Nav-Tab, siehe App.jsx).
  const visibleOrder = order.filter(id => {
    if (!(id in BODIES)) return false
    if (id === 'volksmerkmale') return !!race
    if (id === 'klassenmerkmale') return !!klass
    return true
  })

  return (
    <div className="section char-tab">
      {visibleOrder.map((id, idx) => {
        const isCollapsed = collapsed.has(id)
        return (
          <section key={id}>
            <div className="ct-heading-row">
              <button className="ct-collapse-btn" onClick={() => toggleCollapsed(id)} title={isCollapsed ? (L ? 'Aufklappen' : 'Expand') : (L ? 'Zuklappen' : 'Collapse')}>
                {isCollapsed ? '▶' : '▼'}
              </button>
              <h3 className="section-title ct-heading-clk" onClick={() => toggleCollapsed(id)}>{HEADINGS[id]}</h3>
              {isCollapsed && SUMMARIES[id] && <span className="ct-heading-summary">{SUMMARIES[id]}</span>}
              <div className="ct-move-btns">
                <button className="ct-move-btn" disabled={idx === 0} onClick={() => moveSection(id, -1)} title={L ? 'Nach oben' : 'Move up'}>↑</button>
                <button className="ct-move-btn" disabled={idx === visibleOrder.length - 1} onClick={() => moveSection(id, 1)} title={L ? 'Nach unten' : 'Move down'}>↓</button>
              </div>
            </div>
            {!isCollapsed && <div className="ct-body">{BODIES[id]()}</div>}
          </section>
        )
      })}
    </div>
  )
}
