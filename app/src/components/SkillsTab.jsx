import { useMemo } from 'react'
import skillsData from '../data/skills.json'
import { computeCharacterStats } from '../engine/characterStats.js'
import { computeSkillBonus } from '../engine/skills.js'
import { NumberField } from './NumberField.jsx'
import './SkillsTab.css'

export function SkillsTab({ char, update, lang }) {
  const L = lang === 'de'
  const stats = useMemo(() => computeCharacterStats(char), [char])
  const { klass, level, abilityMods, classAbbr } = stats
  const intMod = abilityMods.IN

  function setSkillRanks(skillId, ranks) {
    const clamped = Math.max(0, Math.min(level, Number(ranks) || 0))
    update({ skills: { [skillId]: { ranks: clamped } } })
  }

  return (
    <div className="section skills-tab">
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
              <NumberField
                className="skill-ranks-input"
                min={0} max={level}
                value={ranks}
                onCommit={v => setSkillRanks(s.id, v)}
              />
              <span className={`skill-bonus ${usable ? '' : 'disabled'}`}>{bonus >= 0 ? `+${bonus}` : bonus}</span>
            </div>
          )
        })}
      </div>
      <p className="attr-note">{L ? '• = Klassenfertigkeit, 🔒 = nur geübt nutzbar (mind. 1 Rang nötig)' : '• = class skill, 🔒 = trained only'}</p>
    </div>
  )
}
