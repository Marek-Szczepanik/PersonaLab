import type { ModelsResponse } from '../types/ModelTypes'
import type { HealthResponse } from '../types/ApiTypes'
import type { Persona, PersonaCreate } from '../types/PersonaTypes'
import type { ComparisonEvent, ComparisonRequest } from '../types/ComparisonTypes'

/** Provede požadavek a převede chyby backendu na srozumitelnou zprávu. */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, { ...options, signal: AbortSignal.timeout(15000) })
  } catch {
    throw new Error('Backend neodpovídá. Ověřte, že běží, a zkuste to znovu.')
  }
  await checkResponse(response)
  try {
    return await response.json() as T
  } catch {
    throw new Error('Backend vrátil neplatnou odpověď. Zkuste to znovu.')
  }
}

/** Převede neúspěšnou HTTP odpověď na společnou chybovou zprávu. */
async function checkResponse(response: Response): Promise<void> {
  if (!response.ok) {
    let message = `Požadavek se nezdařil (HTTP ${response.status}).`
    try {
      const data = await response.json()
      if (typeof data.detail === 'string') message = data.detail
      else if (response.status === 422) message = 'Zkontrolujte povinná pole a jejich délku.'
    } catch { /* Proxy nemusí vracet JSON. */ }
    throw new Error(message)
  }
}

/** Ověří jeden řádek stavového proudu před předáním do Reactu. */
function parseComparisonEvent(line: string): ComparisonEvent {
  const event = JSON.parse(line) as ComparisonEvent
  if (!event || typeof event.persona_id !== 'string' || typeof event.model !== 'string'
    || !['waiting', 'generating', 'done', 'error'].includes(event.status)
    || (event.text !== undefined && typeof event.text !== 'string')
    || (event.status === 'done' && typeof event.text !== 'string')
    || (event.status === 'error' && typeof event.error !== 'string')) {
    throw new Error('Backend vrátil neplatný stav generování.')
  }
  return event
}

/** Čte NDJSON průběžně; zachová i JSON a UTF-8 znaky rozdělené mezi pakety. */
export async function compare(
  data: ComparisonRequest,
  onEvent: (event: ComparisonEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  let response: Response
  try {
    response = await fetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal,
    })
  } catch {
    throw new Error('Backend není dostupný. Zkuste požadavek znovu.')
  }
  await checkResponse(response)
  if (!response.body) throw new Error('Backend nevrátil proud odpovědí.')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (line.trim()) onEvent(parseComparisonEvent(line))
      }
      if (done) break
    }
    if (buffer.trim()) onEvent(parseComparisonEvent(buffer))
  } catch (error) {
    if (error instanceof TypeError) throw new Error('Spojení s backendem bylo přerušeno. Zkuste požadavek znovu.', { cause: error })
    if (error instanceof SyntaxError) throw new Error('Backend vrátil neplatnou odpověď.', { cause: error })
    throw error
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
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
