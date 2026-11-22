import type { QuestionFormProps } from '../types/FormTypes'

/** Odešle neprázdnou otázku a během generování zabrání změně zadání. */
export default function QuestionForm({ question, onChange, onSubmit, onStop, busy, canSubmit }: QuestionFormProps) {
  return (
    <form className="question-form" onSubmit={event => { event.preventDefault(); if (canSubmit) onSubmit() }}>
      <label htmlFor="question">Otázka</label>
      <div className="question-input-row">
        <textarea
          id="question"
          placeholder="Napište otázku…"
          rows={2}
          maxLength={20000}
          disabled={busy}
          value={question}
          onChange={event => onChange(event.target.value)}
        />
        {busy
          ? <button key="stop" type="button" className="secondary-button" onClick={event => { event.preventDefault(); onStop() }}>Zastavit</button>
          : <button key="submit" type="submit" className="primary-button" disabled={!canSubmit}>Odeslat</button>}
      </div>
    </form>
  )
}
