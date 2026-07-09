import './StatTag.css'

// Zeigt die Summe aus Buff- und Zustands-Quellen für einen Wert als kleines
// Badge, Tooltip listet die einzelnen Quellen auf (Name + Delta). Buffs und
// Zustände teilen sich dieselbe Badge-Optik - der Tooltip unterscheidet sie
// über den Namen, analog zum Vorbild in pf1-bogen.
export function StatTag({ sources }) {
  if (!sources || sources.length === 0) return null
  const total = sources.reduce((sum, s) => sum + s.value, 0)
  if (total === 0) return null
  const title = sources.map(s => `${s.name}: ${s.value > 0 ? '+' : ''}${s.value}`).join(', ')
  return (
    <span className={`stat-tag ${total > 0 ? 'pos' : 'neg'}`} title={title}>
      ✦{total > 0 ? `+${total}` : total}
    </span>
  )
}
