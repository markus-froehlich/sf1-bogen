import { useMemo, useState } from 'react'
import racesData from '../data/races.json'
import classesData from '../data/classes.json'
import { AttributeBlock } from './AttributeBlock.jsx'
import { BioSection } from './BioSection.jsx'
import { FeatsTab } from './FeatsTab.jsx'
import { XpTracker } from './XpTracker.jsx'
import { useSectionOrder } from '../store/useSectionOrder.js'
import { computeCharacterStats } from '../engine/characterStats.js'
import './CharacterTab.css'

const CHAR_SECTIONS_DEFAULT = ['volk_klasse', 'xp', 'bio', 'attribute', 'talente', 'volksmerkmale', 'klassenmerkmale']

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

export function CharacterTab({ char, setMeta, setClass, setAttr, update, setBio, setFeats, setXp, lang }) {
  const L = lang === 'de'
  const stats = useMemo(() => computeCharacterStats(char), [char])
  const { race, klass, level, abilityMods, statTags } = stats

  const [order, moveSection] = useSectionOrder('sf1_attr_order', CHAR_SECTIONS_DEFAULT)
  const [collapsed, toggleCollapsed] = useCollapsed('sf1_attr_collapsed')

  const classEntry = char.meta?.classes?.[0] || { id: '', level: 1 }

  const HEADINGS = {
    volk_klasse: L ? 'Volk & Klasse' : 'Race & Class',
    xp: L ? 'Erfahrung' : 'Experience',
    bio: L ? 'Bio' : 'Bio',
    attribute: L ? 'Attribute' : 'Attributes',
    talente: L ? 'Talente' : 'Feats',
    volksmerkmale: L ? 'Volksmerkmale' : 'Racial traits',
    klassenmerkmale: L ? 'Klassenmerkmale' : 'Class features',
  }

  const BODIES = {
    volk_klasse: () => (
      <>
        <div className="bio-row-2">
          <div className="bio-field">
            <label className="bio-label">{L ? 'Volk' : 'Race'}</label>
            <select className="bio-select" value={char.meta?.race || ''} onChange={e => setMeta('race', e.target.value)}>
              <option value="">—</option>
              {racesData.races.map(r => (
                <option key={r.id} value={r.id}>{r.name.de}</option>
              ))}
            </select>
          </div>
          <div className="bio-field">
            <label className="bio-label">{L ? 'Klasse' : 'Class'}</label>
            <select className="bio-select" value={classEntry.id} onChange={e => setClass(0, 'id', e.target.value)}>
              <option value="">—</option>
              {classesData.classes.map(c => (
                <option key={c.id} value={c.id}>{c.name.de}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="bio-row-2">
          <div className="bio-field">
            <label className="bio-label">{L ? 'Charakterstufe' : 'Character level'}</label>
            <input className="bio-input bio-input-num" type="number" min={1} max={20}
              value={classEntry.level} onChange={e => setClass(0, 'level', Math.max(1, Math.min(20, Number(e.target.value) || 1)))} />
          </div>
          <div className="bio-field">
            <label className="bio-label">{L ? 'Schlüsselattribut' : 'Key ability'}</label>
            <input className="bio-input" readOnly value={klass?.key_ability || '—'} />
          </div>
        </div>
        {race && <p className="char-hint">{race.ability_mods_text} · {race.hp_bonus} TP · {race.size} · {race.creature_type}</p>}
        {klass && <p className="char-hint">{klass.key_ability_note}</p>}
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
                sources: statTags[k],
              }}
              onScoreChange={(attr, v) => setAttr(attr, v)}
            />
          ))}
        </div>
      </>
    ),
    talente: () => <FeatsTab char={char} setFeats={setFeats} lang={lang} />,
    volksmerkmale: () => race && (
      <div className="feature-list">
        {race.traits.map(t => (
          <div key={t.name} className="feature-item">
            <span className="feature-name">{t.name}</span>
            <p className="feature-desc">{t.description}</p>
          </div>
        ))}
      </div>
    ),
    klassenmerkmale: () => klass && (
      <>
        <div className="feature-list">
          {klass.features.filter(f => f.level_gained <= level).map(f => (
            <div key={f.name} className="feature-item">
              <span className="feature-name">{f.name} <span className="feature-level">({L ? 'Stufe' : 'Level'} {f.level_gained})</span></span>
              <p className="feature-desc">{f.description}</p>
            </div>
          ))}
        </div>
        {klass.notes && <p className="char-hint">{klass.notes}</p>}
      </>
    ),
  }

  // Abschnitte, die ohne Volk/Klasse nichts anzuzeigen hätten, werden übersprungen
  const visibleOrder = order.filter(id => {
    if (id === 'volksmerkmale') return !!race
    if (id === 'klassenmerkmale') return !!klass
    return true
  })

  return (
    <div className="section char-tab">
      {visibleOrder.map((id, idx) => {
        const isCollapsed = collapsed.has(id)
        const Body = BODIES[id]
        return (
          <section key={id}>
            <div className="ct-heading-row">
              <button className="ct-collapse-btn" onClick={() => toggleCollapsed(id)} title={isCollapsed ? (L ? 'Aufklappen' : 'Expand') : (L ? 'Zuklappen' : 'Collapse')}>
                {isCollapsed ? '▶' : '▼'}
              </button>
              <h3 className="section-title ct-heading-clk" onClick={() => toggleCollapsed(id)}>{HEADINGS[id]}</h3>
              <div className="ct-move-btns">
                <button className="ct-move-btn" disabled={idx === 0} onClick={() => moveSection(id, -1)} title={L ? 'Nach oben' : 'Move up'}>↑</button>
                <button className="ct-move-btn" disabled={idx === visibleOrder.length - 1} onClick={() => moveSection(id, 1)} title={L ? 'Nach unten' : 'Move down'}>↓</button>
              </div>
            </div>
            {!isCollapsed && <div className="ct-body"><Body /></div>}
          </section>
        )
      })}
    </div>
  )
}
