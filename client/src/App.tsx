import { useCallback, useEffect, useRef, useState } from 'react'
import AnonymousToggle from './components/AnonymousToggle'
import ComparisonMatrix from './components/ComparisonMatrix'
import CreatePersonaDialog from './components/CreatePersonaDialog'
import ModelSelector from './components/ModelSelector'
import PersonaSelector from './components/PersonaSelector'
import QuestionForm from './components/QuestionForm'
import { compare, errorMessage, getHealth, getModels, getPersonas } from './services/api'
import type { Persona } from './types/PersonaTypes'
import type { Model } from './types/ModelTypes'
import type { ComparisonEvent, ComparisonResults, ComparisonRun } from './types/ComparisonTypes'
import './App.css'

/** Skládá rozhraní a udržuje výběry i průběžné výsledky porovnání. */
export default function App() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<Model[]>([])
  const [personasLoading, setPersonasLoading] = useState(true)
  const [modelsLoading, setModelsLoading] = useState(true)
  const [personasError, setPersonasError] = useState('')
  const [modelsError, setModelsError] = useState('')
  const [apiStatus, setApiStatus] = useState('Připojování…')
  const [anonymous, setAnonymous] = useState(false)
  const [question, setQuestion] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [results, setResults] = useState<ComparisonResults>({})
  const [comparing, setComparing] = useState(false)
  const comparisonRun = useRef<ComparisonRun | null>(null)

  /** Obnoví konfigurace person a zachová pouze platný výběr. */
  const loadPersonas = useCallback(async () => {
    setPersonasLoading(true)
    setPersonasError('')
    try {
      const data = await getPersonas()
      setPersonas(data)
      setSelectedPersonas(current => current.filter(id => data.some(persona => persona.id === id)))
    } catch (error) { setPersonasError(errorMessage(error)) }
    finally { setPersonasLoading(false) }
  }, [])

  /** Obnoví seznam Ollamy a vyřadí již nedostupné modely z výběru. */
  const loadModels = useCallback(async () => {
    setModelsLoading(true)
    setModelsError('')
    try {
      const data = await getModels()
      setModels(data)
      setSelectedModels(current => current.filter(model => data.includes(model)))
    } catch (error) { setModelsError(errorMessage(error)) }
    finally { setModelsLoading(false) }
  }, [])

  useEffect(() => {
    let active = true
    void getPersonas().then(data => {
      if (!active) return
      setPersonas(data)
      setSelectedPersonas(data.slice(0, 2).map(persona => persona.id))
    }).catch(error => { if (active) setPersonasError(errorMessage(error)) })
      .finally(() => { if (active) setPersonasLoading(false) })
    void getModels().then(data => {
      if (!active) return
      setModels(data)
      setSelectedModels(data.slice(0, 2))
    }).catch(error => { if (active) setModelsError(errorMessage(error)) })
      .finally(() => { if (active) setModelsLoading(false) })
    void getHealth().then(data => {
      if (active) setApiStatus(data.status === 'ok' ? 'API připojeno' : 'Chyba API')
    }).catch(() => { if (active) setApiStatus('Backend není dostupný') })
    return () => {
      active = false
      const run = comparisonRun.current
      comparisonRun.current = null
      if (run) { run.stopped = true; run.controller?.abort() }
    }
  }, [])

  /** Zařadí uloženou konfiguraci do nabídky i aktuálního porovnání. */
  function handleCreated(persona: Persona) {
    setPersonas(current => [...current.filter(item => item.id !== persona.id), persona])
    setSelectedPersonas(current => [...new Set([...current, persona.id])])
    setPersonasError('')
    setCreateOpen(false)
    setResults({})
  }

  const chosenPersonas = selectedPersonas.flatMap(id => personas.filter(persona => persona.id === id))
  const canSubmit = Boolean(question.trim() && chosenPersonas.length && selectedModels.length
    && !personasLoading && !modelsLoading && !comparing)

  /** Aktualizuje pouze existující buňku aktuálního porovnání. */
  function updateCell(event: ComparisonEvent) {
    setResults(current => {
      if (!current[event.persona_id]?.[event.model]) return current
      return {
        ...current,
        [event.persona_id]: {
          ...current[event.persona_id],
          [event.model]: { ...current[event.persona_id][event.model], ...event },
        },
      }
    })
  }

  /** Přeruší aktuální volání a zabrání spuštění dalších kombinací. */
  function handleStop() {
    const run = comparisonRun.current
    if (!run) return
    run.stopped = true
    run.controller?.abort()
  }

  /** Přeruší pouze konkrétní aktivní buňku; další kombinace pokračují. */
  function handleSkip(personaId: string, model: Model) {
    const run = comparisonRun.current
    if (run?.personaId === personaId && run.model === model && !run.stopped) run.controller?.abort()
  }

  /** Volá kombinace postupně, aby šlo každé volání samostatně přerušit. */
  async function handleCompare() {
    if (!canSubmit || comparisonRun.current) return
    const run: ComparisonRun = { controller: null, personaId: null, model: null, stopped: false }
    comparisonRun.current = run
    setComparing(true)
    setResults(Object.fromEntries(chosenPersonas.map(persona => [persona.id,
      Object.fromEntries(selectedModels.map(model => [model, {
        persona_id: persona.id, model, status: 'waiting',
      }])),
    ])))
    try {
      for (const model of selectedModels) {
        for (const persona of chosenPersonas) {
          if (run.stopped || comparisonRun.current !== run) return
          const controller = new AbortController()
          run.controller = controller
          run.personaId = persona.id
          run.model = model
          let finished = false
          let failure = 'Generování bylo přerušeno před dokončením odpovědi.'
          try {
            await compare({ question: question.trim(), persona_ids: [persona.id], models: [model] }, event => {
              if (comparisonRun.current !== run || controller.signal.aborted || run.stopped) return
              if (event.persona_id !== persona.id || event.model !== model) return
              finished = event.status === 'done' || event.status === 'error'
              updateCell(event)
            }, controller.signal)
          } catch (error) {
            failure = errorMessage(error)
          } finally {
            run.controller = null
          }
          if (comparisonRun.current !== run) return
          if (!finished) {
            updateCell({
              persona_id: persona.id,
              model,
              status: controller.signal.aborted ? (run.stopped ? 'cancelled' : 'skipped') : 'error',
              ...(controller.signal.aborted ? {} : { error: failure }),
            })
          }
        }
      }
    } finally {
      if (comparisonRun.current === run) {
        setResults(current => Object.fromEntries(Object.entries(current).map(([personaId, cells]) => [personaId,
          Object.fromEntries(Object.entries(cells).map(([model, cell]) => [model,
            cell.status === 'waiting' || cell.status === 'generating'
              ? run.stopped
                ? { ...cell, status: 'cancelled' }
                : { ...cell, status: 'error', error: 'Generování bylo přerušeno před dokončením odpovědi.' }
              : cell,
          ])),
        ])))
        comparisonRun.current = null
        setComparing(false)
      }
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <h1 className="brand">PersonaLab</h1>
        <span className={`api-status${apiStatus === 'API připojeno' ? ' connected' : ''}`} role="status"><span />{apiStatus}</span>
      </header>
      <main className="workspace">
        <section className="comparison-panel" aria-label="Porovnání person a modelů">
          <fieldset className="selectors" disabled={comparing}>
            <PersonaSelector
              personas={personas}
              selected={selectedPersonas}
              loading={personasLoading}
              error={personasError}
              onChange={selected => { setSelectedPersonas(selected); setResults({}) }}
              onCreate={() => setCreateOpen(true)}
              onRetry={() => void loadPersonas()}
            />
            <ModelSelector
              models={models}
              selected={selectedModels}
              loading={modelsLoading}
              error={modelsError}
              onChange={selected => { setSelectedModels(selected); setResults({}) }}
              onRetry={() => void loadModels()}
            />
          </fieldset>
          <div className="matrix-toolbar">
            <AnonymousToggle checked={anonymous} onChange={setAnonymous} />
          </div>
          <ComparisonMatrix personas={chosenPersonas} models={selectedModels} anonymous={anonymous} results={results} onSkip={handleSkip} />
          <QuestionForm
            question={question}
            onChange={value => { setQuestion(value); setResults({}) }}
            onSubmit={() => void handleCompare()}
            onStop={handleStop}
            busy={comparing}
            canSubmit={canSubmit}
          />
        </section>
      </main>
      {createOpen && <CreatePersonaDialog onClose={() => setCreateOpen(false)} onCreated={handleCreated} />}
    </div>
  )
}
