import type { ReactNode } from 'react'

/** Jedna obecná položka vyhledávatelného výběru. */
export interface SelectorOption {
  id: string
  label: string
  description?: string
}

/** Společné vlastnosti výběru s odebratelnými štítky. */
export interface SelectionPickerProps {
  label: string
  options: SelectorOption[]
  selected: string[]
  loading: boolean
  error: string
  emptyMessage: string
  onChange: (selected: string[]) => void
  onRetry: () => void
  footer?: ReactNode
}
