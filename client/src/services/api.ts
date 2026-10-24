import type { ModelsResponse } from '../types/ModelTypes'
import type { HealthResponse } from '../types/ApiTypes'
import type { Persona, PersonaCreate } from '../types/PersonaTypes'

/** Provede požadavek a převede chyby backendu na srozumitelnou zprávu. */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, { ...options, signal: AbortSignal.timeout(15000) })
  } catch {
    throw new Error('Backend neodpovídá. Ověřte, že běží, a zkuste to znovu.')
  }
  if (!response.ok) {
    let message = `Požadavek se nezdařil (HTTP ${response.status}).`
    try {
      const data = await response.json()
      if (typeof data.detail === 'string') message = data.detail
      else if (response.status === 422) message = 'Zkontrolujte povinná pole a jejich délku.'
    } catch { /* Proxy nemusí vracet JSON. */ }
    throw new Error(message)
  }
  try {
    return await response.json() as T
  } catch {
    throw new Error('Backend vrátil neplatnou odpověď. Zkuste to znovu.')
  }
}

/** Ověří dostupnost stávajícího API. */
export function getHealth() {
  return request<HealthResponse>('/health')
}

/** Načte aktuální JSON konfigurace person. */
export function getPersonas() {
  return request<Persona[]>('/personas')
}

/** Načte skutečně nainstalované modely Ollamy. */
export async function getModels() {
  const data = await request<ModelsResponse>('/models')
  return [...new Set(data.models)]
}

/** Uloží novou osobnost; existující konfigurace backend nepřepisuje. */
export function createPersona(persona: PersonaCreate) {
  return request<Persona>('/personas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(persona),
  })
}

/** Sjednotí zobrazení neočekávaných chyb v komponentách. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Nastala neočekávaná chyba.'
}
