import { useEffect, useRef, useState } from 'react'
import { createPersona, errorMessage } from '../services/api'
import type { CreatePersonaDialogProps } from '../types/FormTypes'
import type { FormEvent } from 'react'

/** Přístupný modální formulář pro trvalé uložení osobnosti do JSON. */
export default function CreatePersonaDialog({ onClose, onCreated }: CreatePersonaDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const submitting = useRef(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement
    element?.showModal()
    return () => {
      element?.close()
      if (previousFocus instanceof HTMLElement) previousFocus.focus()
    }
  }, [])

  /** Validuje neprázdné hodnoty a po uložení vybere novou personu. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    if (![name, description, systemPrompt].every(value => value.trim())) {
      setError('Vyplňte všechna povinná pole. Samotné mezery nestačí.')
      return
    }
    submitting.current = true
    setBusy(true)
    setError('')
    try {
      const persona = await createPersona({
        name: name.trim(),
        description: description.trim(),
        system_prompt: systemPrompt.trim(),
      })
      onCreated(persona)
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={dialog}
      className="persona-dialog"
      aria-labelledby="dialog-title"
      onCancel={event => { event.preventDefault(); if (!busy) onClose() }}
    >
      <div className="dialog-heading">
        <div>
          <h2 id="dialog-title">Vytvořit novou osobnost</h2>
        </div>
        <button type="button" className="close-button" aria-label="Zavřít formulář" disabled={busy} onClick={onClose}>×</button>
      </div>
      <form onSubmit={handleSubmit}>
        <fieldset disabled={busy}>
          <label htmlFor="persona-name">Název <span>*</span></label>
          <input id="persona-name" autoFocus required maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder="Např. Zvídavý badatel" />
          <label htmlFor="persona-description">Popis <span>*</span></label>
          <input id="persona-description" required maxLength={500} value={description} onChange={event => setDescription(event.target.value)} placeholder="Krátká charakteristika osobnosti" />
          <label htmlFor="persona-prompt">System prompt <span>*</span></label>
          <textarea
            id="persona-prompt"
            required
            maxLength={20000}
            rows={5}
            value={systemPrompt}
            onChange={event => setSystemPrompt(event.target.value)}
            placeholder="Popište perspektivu, styl uvažování a způsob odpovídání…"
          />
          <p className="field-hint">Všechna pole jsou povinná.</p>
        </fieldset>
        {error && <p className="dialog-error" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Zrušit</button>
          <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Ukládání…' : 'Vytvořit osobnost'}</button>
        </div>
      </form>
    </dialog>
  )
}
