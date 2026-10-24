import type { AnswerCardProps } from '../types/ComparisonTypes'

/** Zobrazuje prázdný stav; je připravena na budoucí odpověď a hodnocení. */
export default function AnswerCard({ answer }: AnswerCardProps) {
  return (
    <article className={`answer-card${answer ? ' has-answer' : ''}`} aria-label="Odpověď modelu">
      {answer ? (
        <p className="answer-text">{answer.text}</p>
      ) : (
        <span>Bez odpovědi</span>
      )}
      {answer && <div className="rating-preview" aria-label={answer.rating ? `Hodnocení ${answer.rating} z 5` : 'Bez hodnocení'}>
        <span aria-hidden="true">
          {[1, 2, 3, 4, 5].map(value => <span className={answer?.rating && value <= answer.rating ? 'star-filled' : ''} key={value}>☆</span>)}
        </span>
      </div>}
    </article>
  )
}
