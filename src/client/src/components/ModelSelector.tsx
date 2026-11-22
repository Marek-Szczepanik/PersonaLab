import SelectionPicker from './SelectionPicker'
import type { ModelSelectorProps } from '../types/ModelSelectorTypes'

/** Nabízí modely skutečně dostupné v lokální Ollamě. */
export default function ModelSelector({ models, ...props }: ModelSelectorProps) {
  return <SelectionPicker {...props} label="Modely" options={models.map(model => ({ id: model, label: model }))} emptyMessage="Není nainstalován žádný model. Přidejte model v Ollamě a obnovte seznam." />
}
