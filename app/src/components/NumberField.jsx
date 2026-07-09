import { useState, useEffect, useRef } from 'react'

// Number-Inputs, die auf jeden Tastendruck mit Number(value)||fallback reagieren,
// überschreiben ein geleertes Feld sofort mit dem Fallback (0/1/max) - dadurch
// lässt sich eine Zahl nie durch "alles markieren, neu tippen" ersetzen, das
// Feld springt bei jedem Zwischenzustand zurück. Diese Komponente hält den
// getippten Text lokal, solange das Feld fokussiert ist, und committet erst
// einen echten Zahlenwert nach außen, wenn der Text tatsächlich eine gültige
// Zahl ist - leere/unfertige Eingaben ("", "-") werden während des Tippens
// toleriert statt sofort überschrieben zu werden.
export function NumberField({ value, onCommit, min, max, className, placeholder, id, autoFocus }) {
  const [text, setText] = useState(value == null ? '' : String(value))
  const editingRef = useRef(false)

  useEffect(() => {
    if (!editingRef.current) setText(value == null ? '' : String(value))
  }, [value])

  function clamp(n) {
    let v = n
    if (min != null) v = Math.max(min, v)
    if (max != null) v = Math.min(max, v)
    return v
  }

  function handleChange(e) {
    const raw = e.target.value
    setText(raw)
    if (raw === '' || raw === '-') return
    const n = Number(raw)
    if (Number.isNaN(n)) return
    onCommit(clamp(n))
  }

  function handleFocus() { editingRef.current = true }

  function handleBlur() {
    editingRef.current = false
    const n = Number(text)
    if (text === '' || text === '-' || Number.isNaN(n)) {
      setText(value == null ? '' : String(value))
      return
    }
    const clamped = clamp(n)
    setText(String(clamped))
    if (clamped !== value) onCommit(clamped)
  }

  return (
    <input
      type="number"
      className={className}
      value={text}
      placeholder={placeholder}
      id={id}
      autoFocus={autoFocus}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  )
}
