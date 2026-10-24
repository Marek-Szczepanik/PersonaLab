import { useEffect, useState } from 'react'

/**
 * Hlavní komponenta aplikace PersonaLab.
 * Ověřuje dostupnost backendového API.
 */
function App() {
  const [status, setStatus] = useState<string>('Načítání...')

  useEffect(() => {
    /**
     * Ověří dostupnost FastAPI backendu.
     */
    async function checkApi(): Promise<void> {
      try {
        const response = await fetch('/api/health')

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        setStatus(data.status === 'ok' ? 'Připojeno' : 'Chyba API')
      } catch {
        setStatus('Backend není dostupný')
      }
    }

    void checkApi()
  }, [])

  return (
    <main>
      <h1>PersonaLab</h1>
      <p>Stav API: {status}</p>
    </main>
  )
}

export default App