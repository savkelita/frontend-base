import * as Sub from 'tea-effect/Sub'

const KEY = 'unload-guard'

export const unloadGuard = (dirty: boolean): Sub.Sub<never> =>
  dirty
    ? Sub.fromCallback<never>(() => {
        const warn = (event: BeforeUnloadEvent) => event.preventDefault()
        window.addEventListener('beforeunload', warn)
        return () => window.removeEventListener('beforeunload', warn)
      }, KEY)
    : Sub.none
