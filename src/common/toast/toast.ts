import { Effect, Stream } from 'effect'
import type * as Cmd from 'tea-effect/Cmd'

export type Intent = 'success' | 'warning' | 'error' | 'info'

export type Action = {
  readonly label: string
  readonly run: () => void
}

export type Toast = {
  readonly intent: Intent
  readonly title: string
  readonly body: string | null
  readonly action: Action | null
  readonly close: () => void
}

export type Handler = (toast: Toast) => void

export type Options<Msg> = {
  readonly body?: string
  readonly then?: () => Msg
  readonly action?: { readonly label: string; readonly msg: () => Msg }
}

let handler: Handler | null = null

export const register = (next: Handler): (() => void) => {
  handler = next
  return () => {
    if (handler === next) handler = null
  }
}

export const notify = <Msg = never>(intent: Intent, title: string, options: Options<Msg> = {}): Cmd.Cmd<Msg> =>
  Stream.asyncPush<Msg>(emit =>
    Effect.sync(() => {
      const show = handler
      const action = options.action

      if (show !== null) {
        show({
          intent,
          title,
          body: options.body ?? null,
          action:
            action === undefined
              ? null
              : {
                  label: action.label,
                  run: () => {
                    emit.single(action.msg())
                    emit.end()
                  },
                },
          close: () => emit.end(),
        })
      }

      if (options.then !== undefined) emit.single(options.then())
      if (show === null || action === undefined) emit.end()
    }),
  )

export const info = <Msg = never>(title: string, options: Options<Msg> = {}): Cmd.Cmd<Msg> =>
  notify('info', title, options)

export const success = <Msg = never>(title: string, options: Options<Msg> = {}): Cmd.Cmd<Msg> =>
  notify('success', title, options)

export const warning = <Msg = never>(title: string, options: Options<Msg> = {}): Cmd.Cmd<Msg> =>
  notify('warning', title, options)

export const failure = <Msg = never>(title: string, options: Options<Msg> = {}): Cmd.Cmd<Msg> =>
  notify('error', title, options)
