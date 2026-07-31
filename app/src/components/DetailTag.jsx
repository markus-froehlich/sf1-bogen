import { useState } from 'react'
import './DetailTag.css'

function sumSources(sources) {
  const total = sources.reduce((sum, s) => sum + s.value, 0)
  const title = sources.map(s => `${s.name}: ${s.value > 0 ? '+' : ''}${s.value}`).join(', ')
  return { total, title }
}

// Kleines Badge, das seinen Detailtext bei Hover (Desktop) UND bei Tap
// (Mobile, wo :hover/title nie feuert) über ein Toggle-Popover anzeigt.
function DetailTag({ className, symbol, value, title }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="tag-wrap">
      <span
        className={className}
        title={title}
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
      >
        {symbol}{value > 0 ? `+${value}` : value}
      </span>
      {open && (
        <span className="tag-popover" onClick={e => { e.stopPropagation(); setOpen(false) }}>
          {title}
        </span>
      )}
    </span>
  )
}

// Buffs (aus dem Buff-Tracker) - immer teal/neutral, unabhängig vom Vorzeichen,
// da ein Buff auch bewusst ein Malus-Eintrag sein kann (z.B. ein Debuff-Zauber
// von Verbündeten erfasst).
export function BuffTag({ sources }) {
  if (!sources || sources.length === 0) return null
  const { total, title } = sumSources(sources)
  if (total === 0) return null
  return <DetailTag className="buff-tag" symbol="✦" value={total} title={title} />
}

// Zustände (aus data/conditions.json) - rot bei Malus, grün bei (seltenem)
// Bonus, damit sie sich von den teal Buff-Badges klar unterscheiden.
export function CondTag({ sources }) {
  if (!sources || sources.length === 0) return null
  const { total, title } = sumSources(sources)
  if (total === 0) return null
  return <DetailTag className={`cond-tag ${total > 0 ? 'cond-pos' : 'cond-neg'}`} symbol="⚡" value={total} title={title} />
}

// Bequemlichkeits-Wrapper für Aufrufstellen, die beide Quellen gemeinsam
// übergeben wollen, ohne zwei Komponenten einzeln einzubinden.
export function StatBadges({ buffSources, condSources }) {
  return (
    <>
      <BuffTag sources={buffSources} />
      <CondTag sources={condSources} />
    </>
  )
}
