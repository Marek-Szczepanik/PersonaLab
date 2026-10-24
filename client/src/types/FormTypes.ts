import type { Persona } from './PersonaTypes'

/** Obsluha zavření formuláře a úspěšného vytvoření persony. */
export interface CreatePersonaDialogProps {
  onClose: () => void
  onCreated: (persona: Persona) => void
}

/** Řízený přepínač skrytí jmen v matici. */
export interface AnonymousToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

/** Rozepsaná otázka připravená pro pozdější generování. */
export interface QuestionFormProps {
  question: string
  onChange: (question: string) => void
}
