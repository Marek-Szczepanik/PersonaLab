import type { Model } from './ModelTypes'

/** Stav a obsluha výběru modelů z Ollamy. */
export interface ModelSelectorProps {
  models: Model[]
  selected: Model[]
  loading: boolean
  error: string
  onChange: (selected: Model[]) => void
  onRetry: () => void
}
