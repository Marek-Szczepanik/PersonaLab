import type { AnswerCardProps, ComparisonStatus } from '../types/ComparisonTypes'

/** České popisky průběžného stavu jedné buňky. */
const statusLabels: Record<ComparisonStatus, string> = {
  waiting: 'Čeká',
  generating: 'Generuje',
  done: 'Hotovo',
  error: 'Chyba',
  skipped: 'Přeskočeno',
  cancelled: 'Zastaveno',
}

/** Zobrazuje stav konkrétní kombinace a její odpověď nebo chybu. */
export default function AnswerCard({ result, onSkip }: AnswerCardProps) {
  return (
    <article className={`answer-card${result ? ' has-result' : ''}`} aria-label="Odpověď modelu" aria-busy={result?.status === 'generating'}>
      {result ? (
        <>
          <div className="answer-header">
            <span className={`answer-status status-${result.status}`} role="status">{statusLabels[result.status]}</span>
            {result.status === 'generating' && <button type="button" className="text-button" onClick={onSkip}>Přeskočit</button>}
          </div>
          {result.text && <p className="answer-text">{result.text}</p>}
          {result.status === 'error' && <p className="answer-error" role="alert">{result.error}</p>}
        </>
      ) : <span>Bez odpovědi</span>}
    </article>
  )
}
