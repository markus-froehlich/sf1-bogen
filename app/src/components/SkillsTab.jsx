import { useMemo } from 'react'
import skillsData from '../data/skills.json'
import { computeCharacterStats } from '../engine/characterStats.js'
import { computeSkillBonus } from '../engine/skills.js'
import { NumberField } from './NumberField.jsx'
import { StatBadges } from './DetailTag.jsx'
import './SkillsTab.css'

export function SkillsTab({ char, update, lang }) {
  const L = lang === 'de'
  const stats = useMemo(() => computeCharacterStats(char), [char])
  const { klass, level, abilityMods, classAbbr, buffTotals, buffTags, condTags } = stats
  const intMod = abilityMods.IN

  function setSkillRanks(skillId, ranks) {
    const clamped = Math.max(0, Math.min(level, Number(ranks) || 0))
    update({ skills: { [skillId]: { ranks: clamped } } })
  }

  function setSkillMisc(skillId, value) {
    update({ skills: { [skillId]: { misc: Number(value) || 0 } } })
  }

  // Budget-Anzeige (verbraucht/gesamt/übrig) wie pf1-bogen - Formel ist
  // "IN-Modifikator + N" (immer dieselbe Struktur bei allen 7 Klassen,
  // gegen classes.json verifiziert), N per Regex aus dem Formeltext
  // extrahiert statt hartcodiert. Vereinfachung: nutzt den AKTUELLEN
  // IN-Mod für jede Stufe (SF1e-RAW würde den IN-Mod zum jeweiligen
  // Levelaufstieg verwenden, wird hier aber nicht rückwirkend
  // nachgehalten) - wie an anderen Stellen in dieser App als Annäherung
  // gekennzeichnet.
  const baseMatch = klass?.skill_ranks_per_level_formula?.match(/\+\s*(\d+)/)
  const basePerLevel = baseMatch ? Number(baseMatch[1]) : null
  const totalSkillPoints = basePerLevel != null ? Math.max(1, basePerLevel + intMod) * level : null
  const usedSkillPoints = skillsData.skills.filter(s => s.id !== 'beruf')
    .reduce((sum, s) => sum + (char.skills?.[s.id]?.ranks || 0), 0)
    + (char.professions ?? []).reduce((sum, p) => sum + (Number(p.ranks) || 0), 0)
  const remainingSkillPoints = totalSkillPoints != null ? totalSkillPoints - usedSkillPoints : null

  function addProfession() {
    const id = Math.random().toString(36).slice(2, 9)
    update({ professions: [...(char.professions ?? []), { id, name: '', ability: 'WE', ranks: 0 }] })
  }

  function updateProfession(id, patch) {
    update({ professions: (char.professions ?? []).map(p => p.id === id ? { ...p, ...patch } : p) })
  }

  function removeProfession(id) {
    update({ professions: (char.professions ?? []).filter(p => p.id !== id) })
  }

  return (
    <div className="section skills-tab">
      <p className="attr-note">
        {L ? `Fertigkeitsränge pro Stufe: ${klass?.skill_ranks_per_level_formula || '—'} (IN-Mod ${intMod >= 0 ? '+' + intMod : intMod})`
           : `Skill ranks per level: ${klass?.skill_ranks_per_level_formula || '—'}`}
      </p>
      {totalSkillPoints != null && (
        <div className={`skill-budget ${remainingSkillPoints < 0 ? 'over' : remainingSkillPoints === 0 ? 'done' : ''}`}>
          <span>{L ? 'Fertigkeitspunkte' : 'Skill points'}</span>
          <span className="skill-used">{usedSkillPoints}</span>
          <span>/</span>
          <span>{totalSkillPoints}</span>
          <span className={`skill-remain ${remainingSkillPoints < 0 ? 'neg' : ''}`}>
            ({remainingSkillPoints >= 0 ? '+' : ''}{remainingSkillPoints} {L ? 'frei' : 'free'})
          </span>
        </div>
      )}
      <div className="skill-table">
        {skillsData.skills.filter(s => s.id !== 'beruf').map(s => {
          const ranks = char.skills?.[s.id]?.ranks || 0
          const isClassSkill = classAbbr ? s.class_skill_for.includes(classAbbr) : false
          const keyMod = ['ST', 'GE', 'KO', 'IN', 'WE', 'CH'].includes(s.key_ability) ? abilityMods[s.key_ability] : 0
          const isPerception = s.id === 'wahrnehmung'
          const misc = Number(char.skills?.[s.id]?.misc) || 0
          const otherModifiers = buffTotals.skills + (isPerception ? buffTotals.perception : 0) + misc
          // Zusätzlich zu den flachen Fertigkeiten-/Wahrnehmungs-Mods auch die
          // Badges des Schlüsselattributs mergen - ein Buff/Zustand, der nur
          // den Attributsmodifikator ändert (z.B. Gelähmt: GE -5), rechnet
          // sich schon korrekt in `keyMod`/den Bonus ein, taucht aber ohne
          // diesen Merge bei keiner Fertigkeitszeile als Badge auf.
          const keyAbility = ['ST', 'GE', 'KO', 'IN', 'WE', 'CH'].includes(s.key_ability) ? s.key_ability : null
          const buffSources = [
            ...buffTags.skills,
            ...(isPerception ? buffTags.perception : []),
            ...(keyAbility ? buffTags[keyAbility] : []),
          ]
          const condSources = [
            ...condTags.skills,
            ...(isPerception ? condTags.perception : []),
            ...(keyAbility ? condTags[keyAbility] : []),
          ]
          const bonus = computeSkillBonus({ ranks, isClassSkill, keyAbilityModifier: keyMod, otherModifiers })
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
              <NumberField
                className="skill-misc-input"
                title={L ? 'Sonstiger Bonus (Gegenstand etc.)' : 'Misc bonus (item etc.)'}
                value={misc}
                onCommit={v => setSkillMisc(s.id, v)}
              />
              <span className={`skill-bonus ${usable ? '' : 'disabled'}`}>{bonus >= 0 ? `+${bonus}` : bonus}</span>
              <StatBadges buffSources={buffSources} condSources={condSources} />
            </div>
          )
        })}
        <div className="profession-group">
          <div className="profession-heading">
            <span>{L ? 'Beruf' : 'Profession'}</span>
            <span>{L ? 'jeweils eigene Fertigkeit' : 'each is a separate skill'}</span>
          </div>
          {(char.professions ?? []).map(p => {
            const ranks = Math.max(0, Math.min(level, Number(p.ranks) || 0))
            const keyAbility = ['CH', 'IN', 'WE'].includes(p.ability) ? p.ability : 'WE'
            const isClassSkill = classAbbr ? skillsData.skills.find(s => s.id === 'beruf').class_skill_for.includes(classAbbr) : false
            const bonus = computeSkillBonus({
              ranks,
              isClassSkill,
              keyAbilityModifier: abilityMods[keyAbility],
              otherModifiers: buffTotals.skills,
            })
            return (
              <div key={p.id} className={`skill-row profession-row ${isClassSkill ? 'is-class' : ''}`}>
                <input
                  className="profession-name"
                  value={p.name ?? ''}
                  placeholder={L ? 'Beruf (z.B. Pilot)' : 'Profession (e.g. pilot)'}
                  onChange={e => updateProfession(p.id, { name: e.target.value })}
                />
                <select className="profession-ability" value={keyAbility}
                  aria-label={L ? 'Schlüsselattribut' : 'Key ability'}
                  onChange={e => updateProfession(p.id, { ability: e.target.value })}>
                  <option value="CH">CH</option>
                  <option value="IN">IN</option>
                  <option value="WE">WE</option>
                </select>
                <NumberField
                  className="skill-ranks-input"
                  min={0} max={level}
                  value={ranks}
                  onCommit={v => updateProfession(p.id, { ranks: Math.max(0, Math.min(level, Number(v) || 0)) })}
                />
                <span className={`skill-bonus ${ranks > 0 ? '' : 'disabled'}`}>{bonus >= 0 ? `+${bonus}` : bonus}</span>
                <button className="profession-delete" onClick={() => removeProfession(p.id)} title={L ? 'Beruf entfernen' : 'Remove profession'}>×</button>
              </div>
            )
          })}
          <button className="profession-add" onClick={addProfession}>+ {L ? 'Beruf hinzufügen' : 'Add profession'}</button>
        </div>
      </div>
      <p className="attr-note">{L ? '• = Klassenfertigkeit, 🔒 = nur geübt nutzbar (mind. 1 Rang nötig)' : '• = class skill, 🔒 = trained only'}</p>
    </div>
  )
}
