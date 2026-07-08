import skillsData from '../data/skills.json'
import { computeCharacterStats } from '../engine/characterStats.js'
import { computeSkillBonus } from '../engine/skills.js'
import './PrintView.css'

export function PrintView({ char, lang, onClose }) {
  const L = lang === 'de'
  const stats = computeCharacterStats(char)
  const { race, klass, level, abilityMods, tp, ap, rp, eac, kac, bab, saveRef, saveWill, saveZah, classAbbr } = stats
  const current = char.resources_current ?? {}
  const bio = char.bio ?? {}
  const feats = char.feats ?? []
  const items = char.inventory?.items ?? []
  const isCaster = !!klass?.is_spellcaster
  const spellsKnown = char.spells_known?.[klass?.id] ?? {}

  return (
    <div className="print-overlay">
      <div className="print-toolbar">
        <span>{L ? 'Druckvorschau' : 'Print preview'}</span>
        <div className="print-toolbar-actions">
          <button className="print-btn print-go" onClick={() => window.print()}>{L ? '🖨 Drucken' : '🖨 Print'}</button>
          <button className="print-btn print-close" onClick={onClose} title={L ? 'Schließen' : 'Close'}>✕</button>
        </div>
      </div>

      <div className="print-page">
        <header className="pp-header">
          <h1>{char.meta?.name || (L ? 'Unbenannter Charakter' : 'Unnamed character')}</h1>
          <p className="pp-subline">
            {race?.name?.de || '—'} · {klass?.name?.de || '—'} {L ? 'Stufe' : 'Level'} {level}
            {bio.campaign ? ` · ${bio.campaign}` : ''}
          </p>
        </header>

        <section className="pp-section">
          <h2>{L ? 'Attribute' : 'Attributes'}</h2>
          <div className="pp-attr-row">
            {['ST', 'GE', 'KO', 'IN', 'WE', 'CH'].map(k => (
              <div key={k} className="pp-attr-box">
                <span className="pp-attr-key">{k}</span>
                <span className="pp-attr-score">{char.attributes?.[k] ?? 10}</span>
                <span className="pp-attr-mod">{abilityMods[k] >= 0 ? `+${abilityMods[k]}` : abilityMods[k]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="pp-section">
          <h2>{L ? 'Trefferpunkte, Ausdauer & Reserve' : 'Hit Points, Stamina & Resolve'}</h2>
          <div className="pp-stat-row">
            <div className="pp-stat-box"><span className="pp-stat-label">TP</span><span className="pp-stat-value">{current.tp ?? tp}/{tp}</span></div>
            <div className="pp-stat-box"><span className="pp-stat-label">AP</span><span className="pp-stat-value">{current.ap ?? ap}/{ap}</span></div>
            <div className="pp-stat-box"><span className="pp-stat-label">RP</span><span className="pp-stat-value">{current.rp ?? rp}/{rp}</span></div>
          </div>
        </section>

        <section className="pp-section">
          <h2>{L ? 'Kampfwerte' : 'Combat'}</h2>
          <div className="pp-stat-row">
            <div className="pp-stat-box"><span className="pp-stat-label">EAC</span><span className="pp-stat-value">{eac}</span></div>
            <div className="pp-stat-box"><span className="pp-stat-label">KAC</span><span className="pp-stat-value">{kac}</span></div>
            <div className="pp-stat-box"><span className="pp-stat-label">{L ? 'GAB' : 'BAB'}</span><span className="pp-stat-value">{bab >= 0 ? `+${bab}` : bab}</span></div>
            <div className="pp-stat-box"><span className="pp-stat-label">Ref</span><span className="pp-stat-value">{saveRef >= 0 ? `+${saveRef}` : saveRef}</span></div>
            <div className="pp-stat-box"><span className="pp-stat-label">Will</span><span className="pp-stat-value">{saveWill >= 0 ? `+${saveWill}` : saveWill}</span></div>
            <div className="pp-stat-box"><span className="pp-stat-label">Zäh</span><span className="pp-stat-value">{saveZah >= 0 ? `+${saveZah}` : saveZah}</span></div>
          </div>
        </section>

        <section className="pp-section">
          <h2>{L ? 'Fertigkeiten' : 'Skills'}</h2>
          <div className="pp-skill-grid">
            {skillsData.skills.map(s => {
              const ranks = char.skills?.[s.id]?.ranks || 0
              const isClassSkill = classAbbr ? s.class_skill_for.includes(classAbbr) : false
              const keyMod = ['ST', 'GE', 'KO', 'IN', 'WE', 'CH'].includes(s.key_ability) ? abilityMods[s.key_ability] : 0
              const bonus = computeSkillBonus({ ranks, isClassSkill, keyAbilityModifier: keyMod })
              return (
                <div key={s.id} className="pp-skill-row">
                  <span>{s.name.de}{isClassSkill ? ' •' : ''}</span>
                  <span>{ranks}</span>
                  <span>{bonus >= 0 ? `+${bonus}` : bonus}</span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="pp-section">
          <h2>{L ? 'Talente' : 'Feats'}</h2>
          {feats.length === 0 && <p className="pp-empty">{L ? '—' : '—'}</p>}
          <ul className="pp-list">
            {feats.map(name => <li key={name}>{name}</li>)}
          </ul>
        </section>

        {race && (
          <section className="pp-section">
            <h2>{L ? 'Volksmerkmale' : 'Racial traits'}</h2>
            {race.traits.map(t => (
              <p key={t.name} className="pp-feature"><strong>{t.name}:</strong> {t.description}</p>
            ))}
          </section>
        )}

        {klass && (
          <section className="pp-section">
            <h2>{L ? 'Klassenmerkmale' : 'Class features'}</h2>
            {klass.features.filter(f => f.level_gained <= level).map(f => (
              <p key={f.name} className="pp-feature"><strong>{f.name}</strong> ({L ? 'Stufe' : 'Level'} {f.level_gained}): {f.description}</p>
            ))}
          </section>
        )}

        <section className="pp-section">
          <h2>{L ? 'Ausrüstung' : 'Equipment'}</h2>
          <p className="pp-note">{L ? 'Crediteinheiten' : 'Credits'}: {char.credits ?? 0}{char.equipped?.armor_id ? ` · ${L ? 'Rüstung' : 'Armor'}: ${char.equipped.armor_id}` : ''}</p>
          {items.length === 0 && <p className="pp-empty">—</p>}
          <ul className="pp-list">
            {items.map(it => <li key={it.id}>{it.name}{it.qty > 1 ? ` ×${it.qty}` : ''}</li>)}
          </ul>
        </section>

        {isCaster && (
          <section className="pp-section">
            <h2>{L ? 'Zauber' : 'Spells'}</h2>
            {Object.entries(spellsKnown).filter(([, names]) => names?.length).map(([grade, names]) => (
              <p key={grade} className="pp-note"><strong>{L ? 'Grad' : 'Grade'} {grade.replace('grad', '')}:</strong> {names.join(', ')}</p>
            ))}
          </section>
        )}

        {char.notes && (
          <section className="pp-section">
            <h2>{L ? 'Notizen' : 'Notes'}</h2>
            <p className="pp-note pp-notes-text">{char.notes}</p>
          </section>
        )}
      </div>
    </div>
  )
}
