import { useState } from 'react'
import { NumberField } from './NumberField.jsx'
import './XpTracker.css'

// Tabelle 2-4: Charakterverbesserung (SF1e-Regelwerk, S. 24) —
// einzelne, universelle EP-Progression (kein Schnell/Mittel/Langsam wie bei PF1e).
const XP_THRESHOLDS = [0, 1300, 3300, 6000, 10000, 15000, 23000, 34000, 50000, 71000, 105000, 145000, 210000, 295000, 425000, 600000, 850000, 1200000, 1700000, 2400000]

function xpLevel(current) {
  let lv = 1
  for (let i = 1; i < XP_THRESHOLDS.length; i++) {
    if (current >= XP_THRESHOLDS[i]) lv = i + 1
    else break
  }
  return Math.min(lv, 20)
}

const fmt = n => n.toLocaleString('de-DE')

export function XpTracker({ char, setXp, totalLevel = 0, lang }) {
  const L = lang === 'de'
  const [addInput, setAddInput] = useState('')

  const xp = char.xp ?? { current: 0 }
  const current   = Number(xp.current) || 0
  const lvFromXp  = xpLevel(current)
  const atMax     = lvFromXp >= 20
  const lvStart   = XP_THRESHOLDS[lvFromXp - 1]
  const lvEnd     = atMax ? null : XP_THRESHOLDS[lvFromXp]
  const progress  = atMax ? 1 : (current - lvStart) / (lvEnd - lvStart)
  const remaining = atMax ? 0 : lvEnd - current
  const mismatch  = totalLevel > 0 && totalLevel !== lvFromXp

  function handleAdd() {
    const n = parseInt(addInput, 10)
    if (!n || n <= 0) return
    setXp('current', current + n)
    setAddInput('')
  }

  return (
    <div className="xp-tracker">
      <div className="xp-header">
        <span className="xp-label">EP</span>
        <span className={`xp-lv ${mismatch ? 'mismatch' : ''}`}>
          {L ? 'Stufe' : 'Lv'} {lvFromXp}
          {mismatch && <span className="xp-mismatch-icon" title={L ? 'EP-Stufe ≠ Klassenstufe' : 'XP level ≠ class level'}>⚠</span>}
        </span>
      </div>

      <div className="xp-bar-wrap">
        <div className="xp-bar-track">
          <div className="xp-bar-fill" style={{ width: `${Math.min(progress * 100, 100)}%` }} />
        </div>
        <div className="xp-bar-labels">
          <span className="xp-cur-lv">{fmt(lvStart)}</span>
          {!atMax && <span className="xp-next-lv">{fmt(lvEnd)}</span>}
        </div>
      </div>

      <div className="xp-row">
        <NumberField
          className="xp-input"
          min={0}
          value={current}
          onCommit={v => setXp('current', v)}
        />
        <span className="xp-unit">EP</span>
        <input
          className="xp-add-input"
          type="number" min={1} placeholder="+EP"
          value={addInput}
          onChange={e => setAddInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button className="xp-add-btn" onClick={handleAdd} disabled={!addInput || Number(addInput) <= 0}>
          +
        </button>
        {!atMax && (
          <span className="xp-remaining">
            {fmt(remaining)} {L ? 'bis Stufe' : 'to lv'} {lvFromXp + 1}
          </span>
        )}
        {atMax && <span className="xp-maxlv">{L ? 'Max. Stufe' : 'Max level'} 🎖</span>}
      </div>
    </div>
  )
}
