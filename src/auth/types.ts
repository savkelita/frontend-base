export const FUNKCIONALNOSTI = ['PretragaVozaca', 'KreiranjeVozaca'] as const

export type Funkcionalnost = (typeof FUNKCIONALNOSTI)[number]

export type AuthorizationConfig = {
  readonly funkcionalnosti: ReadonlyArray<string>
}

export const emptyAuthorization: AuthorizationConfig = { funkcionalnosti: [] }

export const hasFunkcionalnost = (config: AuthorizationConfig, trazena: Funkcionalnost): boolean =>
  config.funkcionalnosti.includes(trazena)

export const hasAllFunkcionalnosti = (config: AuthorizationConfig, trazene: ReadonlyArray<Funkcionalnost>): boolean =>
  trazene.length === 0 || trazene.every(f => hasFunkcionalnost(config, f))
