import type { Model } from './ModelTypes'
import type { Persona } from './PersonaTypes'

/** Průběžný stav jedné kombinace persony a modelu. */
export type ComparisonStatus = 'waiting' | 'generating' | 'done' | 'error' | 'skipped' | 'cancelled'

/** Ovládání aktuálního běhu a právě aktivního volání modelu. */
export interface ComparisonRun {
  controller: AbortController | null
  personaId: string | null
  model: Model | null
  stopped: boolean
}

/** Stavová událost nebo výsledek jedné buňky z backendu. */
export interface ComparisonEvent {
  persona_id: string
  model: Model
  status: ComparisonStatus
  text?: string
  error?: string
}

/** Výsledky indexované podle ID persony a názvu modelu. */
export type ComparisonResults = Record<string, Record<Model, ComparisonEvent>>

/** Data odesílaná při spuštění generování. */
export interface ComparisonRequest {
  question: string
  persona_ids: string[]
  models: Model[]
}

/** Výběr určující rozměry a popisky matice. */
export interface ComparisonMatrixProps {
  personas: Persona[]
  models: Model[]
  anonymous: boolean
  results: ComparisonResults
  onSkip: (personaId: string, model: Model) => void
}

/** Stav jediné karty; před odesláním otázky není výsledek přítomen. */
export interface AnswerCardProps {
  result?: ComparisonEvent
  onSkip: () => void
}
