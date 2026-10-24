import SelectionPicker from './SelectionPicker'
import type { PersonaSelectorProps } from '../types/PersonaSelectorTypes'

/** Nabízí osobnosti načtené z backendu a otevření formuláře. */
export default function PersonaSelector({ personas, onCreate, ...props }: PersonaSelectorProps) {
  return <SelectionPicker {...props} label="Persony" options={personas.map(persona => ({ id: persona.id, label: persona.name, description: persona.description }))} emptyMessage="Zatím tu nejsou žádné persony. Vytvořte první pomocí +." footer={<button type="button" className="create-option" onClick={onCreate}><span aria-hidden="true">＋</span> Vytvořit novou osobnost</button>} />
}
