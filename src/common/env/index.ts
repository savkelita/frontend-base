declare const process: { env: Record<string, string | undefined> }

export type Env = {
  readonly basename: string
  readonly apiBaseUrl: string
  readonly build: string
}

export const env: Env = {
  basename: process.env.basename ?? '/',
  apiBaseUrl: process.env.apiBaseUrl ?? '',
  build: process.env.build ?? 'nepoznat',
}
