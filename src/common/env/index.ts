declare const process: { env: Record<string, string | undefined> }

export type Env = {
  readonly basename: string
}

export const env: Env = {
  basename: process.env.basename ?? '/',
}
