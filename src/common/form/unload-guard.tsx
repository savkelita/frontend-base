import { useEffect } from 'react'

export const UnloadGuard = ({ active }: { readonly active: boolean }): null => {
  useEffect(() => {
    if (!active) return
    const upozori = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', upozori)
    return () => window.removeEventListener('beforeunload', upozori)
  }, [active])

  return null
}
