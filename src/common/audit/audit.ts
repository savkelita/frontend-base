import { Schema } from 'effect'
import * as DateTime from '../domain/date-time'

export const AuditUser = Schema.Struct({
  ime: Schema.String,
  prezime: Schema.String,
})

export type AuditUser = typeof AuditUser.Type

export const Audit = Schema.Struct({
  korisnikKreirao: AuditUser,
  datumKreiranja: DateTime.ioValue,
  korisnikPromenio: Schema.NullOr(AuditUser),
  datumPromene: Schema.NullOr(DateTime.ioValue),
})

export type Audit = typeof Audit.Type

export const renderUser = (user: AuditUser | null): string => (user === null ? '' : `${user.ime} ${user.prezime}`)

export const promenjen = (audit: Audit): boolean => audit.korisnikPromenio !== null || audit.datumPromene !== null
