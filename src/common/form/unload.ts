import * as Sub from 'tea-effect/Sub'

const KEY = 'unload-guard'

export const unloadGuard = (dirty: boolean): Sub.Sub<never> =>
  dirty
    ? Sub.fromCallback<never>(() => {
        const upozori = (event: BeforeUnloadEvent) => event.preventDefault()
        window.addEventListener('beforeunload', upozori)
        return () => window.removeEventListener('beforeunload', upozori)
      }, KEY)
    : Sub.none
