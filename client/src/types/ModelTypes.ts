/** Název modelu vrácený Ollamou včetně případného tagu. */
export type Model = string

/** Odpověď existujícího endpointu modelů. */
export interface ModelsResponse {
  models: Model[]
}
