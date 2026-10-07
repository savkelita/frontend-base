import { Option } from 'effect'
import type { Session } from '../session'

export const WARN_SECONDS = 2 * 60

export type Model = {
  readonly now: Option.Option<number>
  readonly hasCookie: boolean
}

export const initial: Model = { now: Option.none(), hasCookie: true }

export const remaining = (session: Session, model: Model): Option.Option<number> =>
  Option.map(model.now, now => Math.ceil((session.expiration - now) / 1000))

export const warns = (seconds: number): boolean => seconds <= WARN_SECONDS

export const expired = (session: Session, model: Model): boolean =>
  Option.match(remaining(session, model), { onNone: () => false, onSome: seconds => seconds <= 0 })

export const warning = (seconds: number): string => {
  if (seconds > 60) return `Vasa sesija istice za ${Math.ceil(seconds / 60)} min`
  if (seconds > 0) return 'Vasa sesija istice za manje od minuta'
  return 'Vasa sesija je istekla'
}
