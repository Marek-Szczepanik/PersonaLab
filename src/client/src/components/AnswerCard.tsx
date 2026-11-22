import type { AnswerCardProps, ComparisonStatus, RetrievalContext } from '../types/ComparisonTypes'

/** České popisky průběžného stavu jedné buňky. */
const statusLabels: Record<ComparisonStatus, string> = {
  waiting: 'Čeká',
  generating: 'Generuje',
  done: 'Hotovo',
  error: 'Chyba',
  skipped: 'Přeskočeno',
  cancelled: 'Zastaveno',
}

/** Popíše podklady; v anonymním režimu jen počet, protože názvy souborů mohou prozradit personu. */
function sourcesLabel(context: RetrievalContext, anonymous: boolean): string {
  if (context.mode === 'none') return 'Bez podkladů'
  if (!anonymous) return `Podklady: ${context.sources.join(', ')}`
  const count = context.sources.length
  const noun = count === 1 ? 'soubor' : count >= 2 && count <= 4 ? 'soubory' : 'souborů'
  return `Podklady: ${count} ${noun}`
}

/** Zobrazuje stav konkrétní kombinace, použité podklady a odpověď nebo chybu. */
export default function AnswerCard({ result, anonymous, onSkip }: AnswerCardProps) {
  return (
    <article className={`answer-card${result ? ' has-result' : ''}`} aria-label="Odpověď modelu" aria-busy={result?.status === 'generating'}>
      {result ? (
        <>
          <div className="answer-header">
            <span className={`answer-status status-${result.status}`} role="status">{statusLabels[result.status]}</span>
            {result.status === 'generating' && <button type="button" className="text-button" onClick={onSkip}>Přeskočit</button>}
          </div>
          {result.context && <p className="answer-sources">{sourcesLabel(result.context, anonymous)}</p>}
          {result.context?.warning && <p className="answer-warning">{result.context.warning}</p>}
          {result.text && <p className="answer-text">{result.text}</p>}
          {result.status === 'error' && <p className="answer-error" role="alert">{result.error}</p>}
        </>
      ) : <span>Bez odpovědi</span>}
    </article>
  )
}
