import AnswerCard from './AnswerCard'
import type { ComparisonMatrixProps } from '../types/ComparisonTypes'

/** Vykreslí libovolný počet řádků person a sloupců modelů. */
export default function ComparisonMatrix({ personas, models, anonymous, results, onSkip }: ComparisonMatrixProps) {
  if (personas.length === 0 || models.length === 0) {
    return (
      <div className="matrix-empty">
        <p>Vyberte alespoň jednu personu a jeden model.</p>
      </div>
    )
  }

  return (
    <div className="matrix-scroll" tabIndex={0} role="region" aria-label="Matice porovnání, lze posouvat vodorovně">
      <table className="comparison-table">
        <caption className="sr-only">Řádky představují persony, sloupce modely. Každá buňka zobrazuje vlastní stav a odpověď.</caption>
        <thead>
          <tr>
            <th scope="col" className="matrix-corner">PERSONA / MODEL</th>
            {models.map(model => (
              <th scope="col" key={model}>
                <span>{model}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {personas.map((persona, index) => (
            <tr key={persona.id}>
              <th scope="row">
                <strong>{anonymous ? `Persona ${index + 1}` : persona.name}</strong>
                <small>{anonymous ? 'Identita je skrytá' : persona.description}</small>
              </th>
              {models.map(model => (
                <td key={model}>
                  <AnswerCard result={results[persona.id]?.[model]} onSkip={() => onSkip(persona.id, model)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
