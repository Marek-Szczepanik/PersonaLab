import type { Persona } from './PersonaTypes'

/** Stav a obsluha výběru dostupných person. */
export interface PersonaSelectorProps {
  personas: Persona[]
  selected: string[]
  loading: boolean
  error: string
  onChange: (selected: string[]) => void
  onCreate: () => void
  onRetry: () => void
}
