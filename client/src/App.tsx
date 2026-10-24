import { useCallback, useEffect, useState } from 'react'
import AnonymousToggle from './components/AnonymousToggle'
import ComparisonMatrix from './components/ComparisonMatrix'
import CreatePersonaDialog from './components/CreatePersonaDialog'
import ModelSelector from './components/ModelSelector'
import PersonaSelector from './components/PersonaSelector'
import QuestionForm from './components/QuestionForm'
import { errorMessage, getHealth, getModels, getPersonas } from './services/api'
import type { Persona } from './types/PersonaTypes'
import type { Model } from './types/ModelTypes'
import './App.css'

/** Skládá rozhraní a drží sdílený stav porovnání bez generování odpovědí. */
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
    return () => { active = false }
  }, [])

  /** Zařadí uloženou konfiguraci do nabídky i aktuálního porovnání. */
  function handleCreated(persona: Persona) {
    setPersonas(current => [...current.filter(item => item.id !== persona.id), persona])
    setSelectedPersonas(current => [...new Set([...current, persona.id])])
    setPersonasError('')
    setCreateOpen(false)
  }

  const chosenPersonas = selectedPersonas.flatMap(id => personas.filter(persona => persona.id === id))

  return (
    <div className="app-shell">
      <header className="site-header">
        <h1 className="brand">PersonaLab</h1>
        <span className={`api-status${apiStatus === 'API připojeno' ? ' connected' : ''}`} role="status"><span />{apiStatus}</span>
      </header>
      <main className="workspace">
        <section className="comparison-panel" aria-label="Porovnání person a modelů">
          <div className="selectors">
            <PersonaSelector
              personas={personas}
              selected={selectedPersonas}
              loading={personasLoading}
              error={personasError}
              onChange={setSelectedPersonas}
              onCreate={() => setCreateOpen(true)}
              onRetry={() => void loadPersonas()}
            />
            <ModelSelector
              models={models}
              selected={selectedModels}
              loading={modelsLoading}
              error={modelsError}
              onChange={setSelectedModels}
              onRetry={() => void loadModels()}
            />
          </div>
          <div className="matrix-toolbar">
            <AnonymousToggle checked={anonymous} onChange={setAnonymous} />
          </div>
          <ComparisonMatrix personas={chosenPersonas} models={selectedModels} anonymous={anonymous} />
          <QuestionForm question={question} onChange={setQuestion} />
        </section>
      </main>
      {createOpen && <CreatePersonaDialog onClose={() => setCreateOpen(false)} onCreated={handleCreated} />}
    </div>
  )
}
