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

/** Otázka a obsluha spuštění porovnání. */
export interface QuestionFormProps {
  question: string
  onChange: (question: string) => void
  onSubmit: () => void
  onStop: () => void
  busy: boolean
  canSubmit: boolean
}
