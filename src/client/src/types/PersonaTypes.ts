/** Konfigurace osobnosti uložená na backendu. */
export interface Persona {
  id: string
  name: string
  description: string
  system_prompt: string
}

/** Údaje formuláře; bezpečné ID odvozuje backend. */
export type PersonaCreate = Omit<Persona, 'id'>
