import type { AnonymousToggleProps } from '../types/FormTypes'

/** Skryje jména person pouze v porovnávací matici. */
export default function AnonymousToggle({ checked, onChange }: AnonymousToggleProps) {
  return <label className="anonymous-toggle"><input type="checkbox" role="switch" checked={checked} onChange={event => onChange(event.target.checked)} /><span className="switch-track" aria-hidden="true" /><span>Anonymní režim</span></label>
}
