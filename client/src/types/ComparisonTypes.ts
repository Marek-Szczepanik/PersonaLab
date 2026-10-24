import type { Model } from './ModelTypes'
import type { Persona } from './PersonaTypes'

/** Budoucí uživatelské hodnocení odpovědi. */
export type Rating = 1 | 2 | 3 | 4 | 5

/** Budoucí výsledek jedné kombinace persony a modelu. */
export interface Answer {
  text: string
  rating?: Rating
}

/** Výběr určující rozměry a popisky matice. */
export interface ComparisonMatrixProps {
  personas: Persona[]
  models: Model[]
  anonymous: boolean
}

/** Údaje jediné karty; bez výsledku vykreslí prázdný stav. */
export interface AnswerCardProps {
  answer?: Answer
}
