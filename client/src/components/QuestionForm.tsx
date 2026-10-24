import type { QuestionFormProps } from '../types/FormTypes'

/** Uchová rozepsanou otázku bez volání dosud neexistujícího generování. */
export default function QuestionForm({ question, onChange }: QuestionFormProps) {
  return (
    <form className="question-form" onSubmit={event => event.preventDefault()}>
      <label htmlFor="question">Otázka</label>
      <div className="question-input-row">
        <textarea
          id="question"
          placeholder="Napište otázku…"
          rows={2}
          value={question}
          onChange={event => onChange(event.target.value)}
          aria-describedby="generation-note"
        />
        <button type="submit" className="primary-button" disabled>Odeslat</button>
      </div>
      <p id="generation-note">Generování zatím není dostupné.</p>
    </form>
  )
}
