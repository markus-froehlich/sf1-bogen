import { useMemo, useState } from 'react'
import featsData from '../data/feats.json'
import featsFullData from '../data/feats_full.json'
import { computeCharacterStats } from '../engine/characterStats.js'
import './FeatsTab.css'

// Talente-Progression: 1 Talent mit jeder ungeraden Charakterstufe (S. 25, Tabelle 2-4)
function featBudget(level) {
  return Math.ceil((Number(level) || 1) / 2)
}

const FULL_BY_NAME = Object.fromEntries(featsFullData.feats_full.map(f => [f.name, f]))

export function FeatsTab({ char, setFeats, lang }) {
  const L = lang === 'de'
  const stats = useMemo(() => computeCharacterStats(char), [char])
  const [query, setQuery] = useState('')

  const chosen = char.feats ?? []
  const budget = featBudget(stats.level)
  const remaining = budget - chosen.length

  const candidates = useMemo(() => {
    if (!query.trim()) return []
    const q = query.trim().toLowerCase()
    return featsData.feats
      .filter(f => !chosen.includes(f.name) && f.name.toLowerCase().includes(q))
      .slice(0, 8)
  }, [query, chosen])

  function addFeat(name) {
    setFeats(prev => [...prev, name])
    setQuery('')
  }

  function removeFeat(name) {
    setFeats(prev => prev.filter(n => n !== name))
  }

  return (
    <section className="feats-tab">
      <h3 className="section-title">{L ? 'Talente' : 'Feats'}</h3>
        <p className={`char-hint feats-budget ${remaining < 0 ? 'over' : ''}`}>
          {L
            ? `${chosen.length} von ${budget} gewählt (1 Talent pro ungerader Stufe, siehe Tabelle 2-4)`
            : `${chosen.length} of ${budget} chosen (1 feat per odd level)`}
        </p>

        <div className="feats-search">
          <input
            className="bio-input"
            placeholder={L ? 'Talent suchen…' : 'Search feats…'}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {candidates.length > 0 && (
            <div className="feats-candidates">
              {candidates.map(f => (
                <button key={f.name} className="feats-candidate" onClick={() => addFeat(f.name)}>
                  <span className="feats-candidate-name">{f.name}{f.is_combat_feat ? ' [Kampf]' : ''}</span>
                  <span className="feats-candidate-prereq">{f.prerequisites || (L ? 'keine Voraussetzungen' : 'no prerequisites')}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="feats-list">
          {chosen.length === 0 && <p className="char-hint">{L ? 'Noch keine Talente gewählt.' : 'No feats chosen yet.'}</p>}
          {chosen.map(name => {
            const full = FULL_BY_NAME[name]
            const short = featsData.feats.find(f => f.name === name)
            return (
              <div key={name} className="feats-item">
                <div className="feats-item-head">
                  <span className="feats-item-name">{name}{short?.is_combat_feat ? ' [Kampf]' : ''}</span>
                  <button className="feats-item-del" onClick={() => removeFeat(name)} title={L ? 'Löschen' : 'Delete'}>🗑</button>
                </div>
                {short?.prerequisites && (
                  <p className="feats-item-prereq">{L ? 'Voraussetzungen: ' : 'Prerequisites: '}{short.prerequisites}</p>
                )}
                <p className="feats-item-desc">{full?.description || short?.benefit}</p>
                {full?.normal && <p className="feats-item-sub"><strong>{L ? 'Normal: ' : 'Normal: '}</strong>{full.normal}</p>}
                {full?.speziell && <p className="feats-item-sub"><strong>{L ? 'Speziell: ' : 'Special: '}</strong>{full.speziell}</p>}
              </div>
            )
          })}
        </div>
    </section>
  )
}
