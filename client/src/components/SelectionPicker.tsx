import { useId, useRef, useState } from 'react'
import type { SelectionPickerProps } from '../types/SelectorTypes'

/** Sdílí přístupný výběr, vyhledávání a odebratelné štítky. */
export default function SelectionPicker({
  label, options, selected, loading, error, emptyMessage, onChange, onRetry, footer,
}: SelectionPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const panelId = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const available = options.filter(option => !selected.includes(option.id))
  const filtered = available.filter(option =>
    `${option.label} ${option.description ?? ''}`.toLocaleLowerCase('cs').includes(query.toLocaleLowerCase('cs')),
  )

  return (
    <section className="selector" aria-label={label}>
      <div className="field-heading">
        <span>{label}</span><span className="selection-count">{selected.length} vybráno</span>
      </div>
      <div
        className="picker"
        onBlur={event => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
        }}
        onKeyDown={event => {
          if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() }
        }}
      >
        <div className="chip-list">
          {selected.map(id => {
            const option = options.find(item => item.id === id)
            return (
              <span className="chip" key={id}>
                <span>{option?.label ?? id}</span>
                <button type="button" aria-label={`Odebrat ${option?.label ?? id}`} onClick={() => onChange(selected.filter(item => item !== id))}>×</button>
              </span>
            )
          })}
          {selected.length === 0 && <span className="selection-placeholder">Vyberte {label.toLocaleLowerCase('cs')}</span>}
          <button
            ref={trigger}
            type="button"
            className="add-button"
            aria-label={`Přidat: ${label.toLocaleLowerCase('cs')}`}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => { setOpen(!open); setQuery('') }}
          >+</button>
        </div>
        {open && (
          <div className="picker-panel" id={panelId}>
            <input
              autoFocus
              className="search-input"
              aria-label={`Hledat: ${label.toLocaleLowerCase('cs')}`}
              placeholder="Hledat v nabídce…"
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
            <div className="picker-options">
              {loading ? (
                <p className="picker-message" role="status">Načítání…</p>
              ) : error ? (
                <p className="picker-message">Seznam není dostupný.</p>
              ) : filtered.map(option => (
                <button
                  type="button"
                  className="picker-option"
                  key={option.id}
                  onClick={() => { onChange([...selected, option.id]); setOpen(false); trigger.current?.focus() }}
                >
                  <span>{option.label}</span>
                  {option.description && <small>{option.description}</small>}
                </button>
              ))}
              {!loading && !error && filtered.length === 0 && (
                <p className="picker-message">
                  {query ? 'Žádné výsledky hledání.' : options.length === 0 ? emptyMessage : 'Všechny položky už jsou vybrané.'}
                </p>
              )}
            </div>
            {footer && (
              <div className="picker-footer" onClick={() => { setOpen(false); trigger.current?.focus() }}>{footer}</div>
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}{' '}
          <button className="text-button" type="button" onClick={onRetry} disabled={loading}>Zkusit znovu</button>
        </p>
      )}
      {!loading && !error && options.length === 0 && (
        <p className="field-hint">
          {emptyMessage}{' '}
          <button className="text-button" type="button" onClick={onRetry}>Obnovit seznam</button>
        </p>
      )}
    </section>
  )
}
