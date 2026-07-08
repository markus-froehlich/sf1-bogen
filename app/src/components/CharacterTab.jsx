import { useMemo } from 'react'
import racesData from '../data/races.json'
import classesData from '../data/classes.json'
import skillsData from '../data/skills.json'
import { AttributeBlock } from './AttributeBlock.jsx'
import { BioSection } from './BioSection.jsx'
import { FeatsTab } from './FeatsTab.jsx'
import { computeCharacterStats } from '../engine/characterStats.js'
import { computeSkillBonus } from '../engine/skills.js'
import './CharacterTab.css'

export function CharacterTab({ char, setMeta, setClass, setAttr, update, setBio, setFeats, lang }) {
  const L = lang === 'de'
  const stats = useMemo(() => computeCharacterStats(char), [char])
  const { race, klass, level, abilityMods, tp, ap, rp, bab, saveRef, saveWill, saveZah, classAbbr } = stats

  const classEntry = char.meta?.classes?.[0] || { id: '', level: 1 }
  const current = char.resources_current ?? { tp: null, ap: null, rp: null }

  function setResourceCurrent(key, value) {
    update({ resources_current: { [key]: value === '' ? null : Number(value) } })
  }
  function fillResource(key, max) {
    update({ resources_current: { [key]: max } })
  }
  function setSkillRanks(skillId, ranks) {
    const maxRanks = level
    const clamped = Math.max(0, Math.min(maxRanks, Number(ranks) || 0))
    update({ skills: { [skillId]: { ranks: clamped } } })
  }

  const intMod = abilityMods.IN

  return (
    <div className="section char-tab">
      {/* ── Volk & Klasse ── */}
      <section>
        <h3 className="section-title">{L ? 'Volk & Klasse' : 'Race & Class'}</h3>
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
      </section>

      {/* ── Bio ── */}
      <section>
        <h3 className="section-title">{L ? 'Bio' : 'Bio'}</h3>
        <BioSection char={char} setBio={setBio} lang={lang} />
      </section>

      {/* ── Attribute ── */}
      <section>
        <h3 className="section-title">{L ? 'Attribute' : 'Attributes'}</h3>
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
                buff: 0,
                buffed: char.attributes?.[k] ?? 10,
                mod: abilityMods[k],
              }}
              onScoreChange={(attr, v) => setAttr(attr, v)}
            />
          ))}
        </div>
      </section>

      {/* ── Ressourcen: TP/AP/RP ── */}
      <section>
        <h3 className="section-title">{L ? 'Trefferpunkte, Ausdauer & Reserve' : 'Hit Points, Stamina & Resolve'}</h3>
        <div className="sf-resource-row">
          <ResourceBox label="TP" full={L ? 'Trefferpunkte' : 'Hit Points'} max={tp} current={current.tp} onChange={v => setResourceCurrent('tp', v)} onFill={() => fillResource('tp', tp)} />
          <ResourceBox label="AP" full={L ? 'Ausdauerpunkte' : 'Stamina Points'} max={ap} current={current.ap} onChange={v => setResourceCurrent('ap', v)} onFill={() => fillResource('ap', ap)} />
          <ResourceBox label="RP" full={L ? 'Reservepunkte' : 'Resolve Points'} max={rp} current={current.rp} onChange={v => setResourceCurrent('rp', v)} onFill={() => fillResource('rp', rp)} />
        </div>
      </section>

      {/* ── Kampfwerte kurz ── */}
      <section>
        <h3 className="section-title">{L ? 'Kampfwerte' : 'Combat stats'}</h3>
        <div className="sf-stat-row">
          <StatBox label={L ? 'GAB' : 'BAB'} value={bab >= 0 ? `+${bab}` : bab} />
          <StatBox label={L ? 'Reflex' : 'Reflex'} value={saveRef >= 0 ? `+${saveRef}` : saveRef} />
          <StatBox label={L ? 'Wille' : 'Will'} value={saveWill >= 0 ? `+${saveWill}` : saveWill} />
          <StatBox label={L ? 'Zähigkeit' : 'Fortitude'} value={saveZah >= 0 ? `+${saveZah}` : saveZah} />
        </div>
        <p className="char-hint">{L ? 'EAC/KAC und Waffen siehe Tab „Kampf".' : 'See "Combat" tab for EAC/KAC and weapons.'}</p>
      </section>

      {/* ── Fertigkeiten ── */}
      <section>
        <h3 className="section-title">{L ? 'Fertigkeiten' : 'Skills'}</h3>
        <p className="attr-note">
          {L ? `Fertigkeitsränge pro Stufe: ${klass?.skill_ranks_per_level_formula || '—'} (IN-Mod ${intMod >= 0 ? '+' + intMod : intMod})`
             : `Skill ranks per level: ${klass?.skill_ranks_per_level_formula || '—'}`}
        </p>
        <div className="skill-table">
          {skillsData.skills.map(s => {
            const ranks = char.skills?.[s.id]?.ranks || 0
            const isClassSkill = classAbbr ? s.class_skill_for.includes(classAbbr) : false
            const keyMod = ['ST', 'GE', 'KO', 'IN', 'WE', 'CH'].includes(s.key_ability) ? abilityMods[s.key_ability] : 0
            const bonus = computeSkillBonus({ ranks, isClassSkill, keyAbilityModifier: keyMod })
            const usable = s.untrained || ranks > 0
            return (
              <div key={s.id} className={`skill-row ${isClassSkill ? 'is-class' : ''}`}>
                <span className="skill-name" title={s.description}>
                  {s.name.de}{isClassSkill ? ' •' : ''}{!s.untrained ? ' 🔒' : ''}
                </span>
                <span className="skill-key">{s.key_ability === 'CH_IN_oder_WE' ? 'CH/IN/WE' : s.key_ability}</span>
                <input
                  className="skill-ranks-input"
                  type="number" min={0} max={level}
                  value={ranks}
                  onChange={e => setSkillRanks(s.id, e.target.value)}
                />
                <span className={`skill-bonus ${usable ? '' : 'disabled'}`}>{bonus >= 0 ? `+${bonus}` : bonus}</span>
              </div>
            )
          })}
        </div>
        <p className="attr-note">{L ? '• = Klassenfertigkeit, 🔒 = nur geübt nutzbar (mind. 1 Rang nötig)' : '• = class skill, 🔒 = trained only'}</p>
      </section>

      {/* ── Talente ── */}
      <FeatsTab char={char} setFeats={setFeats} lang={lang} />

      {/* ── Volksmerkmale ── */}
      {race && (
        <section>
          <h3 className="section-title">{L ? 'Volksmerkmale' : 'Racial traits'}</h3>
          <div className="feature-list">
            {race.traits.map(t => (
              <div key={t.name} className="feature-item">
                <span className="feature-name">{t.name}</span>
                <p className="feature-desc">{t.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Klassenmerkmale bis aktuelle Stufe ── */}
      {klass && (
        <section>
          <h3 className="section-title">{L ? 'Klassenmerkmale' : 'Class features'}</h3>
          <div className="feature-list">
            {klass.features.filter(f => f.level_gained <= level).map(f => (
              <div key={f.name} className="feature-item">
                <span className="feature-name">{f.name} <span className="feature-level">({L ? 'Stufe' : 'Level'} {f.level_gained})</span></span>
                <p className="feature-desc">{f.description}</p>
              </div>
            ))}
          </div>
          {klass.notes && <p className="char-hint">{klass.notes}</p>}
        </section>
      )}
    </div>
  )
}

function ResourceBox({ label, full, max, current, onChange, onFill }) {
  const value = current ?? max
  return (
    <div className="sf-resource-box" title={full}>
      <span className="sf-resource-label">{label}</span>
      <div className="sf-resource-values">
        <input className="sf-resource-input" type="number" min={0} max={max}
          value={value} onChange={e => onChange(e.target.value)} />
        <span className="sf-resource-max">/ {max}</span>
      </div>
      <button className="sf-resource-fill" onClick={onFill}>↺</button>
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="sf-stat-box">
      <span className="sf-stat-value">{value}</span>
      <span className="sf-stat-label">{label}</span>
    </div>
  )
}
