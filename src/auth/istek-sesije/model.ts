import { Option } from 'effect'
import type { Session } from '../session'

export const PRAG_SEKUNDI = 2 * 60

export type Model = {
  readonly sada: Option.Option<number>
}

export const initial: Model = { sada: Option.none() }

export const preostalo = (session: Session, model: Model): Option.Option<number> =>
  Option.map(model.sada, sada => Math.ceil((session.istek - sada) / 1000))

export const upozorava = (sekundi: number): boolean => sekundi <= PRAG_SEKUNDI

export const istekla = (session: Session, model: Model): boolean =>
  Option.match(preostalo(session, model), { onNone: () => false, onSome: sekundi => sekundi <= 0 })

export const upozorenje = (sekundi: number): string => {
  if (sekundi > 60) return `Vasa sesija istice za ${Math.ceil(sekundi / 60)} min`
  if (sekundi > 0) return 'Vasa sesija istice za manje od minuta'
  return 'Vasa sesija je istekla'
}
