import { Caption1Strong, Caption2, CardHeader, Tooltip, makeStyles, tokens } from '@fluentui/react-components'
import { DocumentAdd20Regular, DocumentEdit20Regular, PersonClock20Regular } from '@fluentui/react-icons'
import * as S_ from 'effect/Schema'
import { S, popuni, t } from '../strings'

// -------------------------------------------------------------------------------------
// Ревизиони подаци
// -------------------------------------------------------------------------------------
//
// Ко је и кад направио запис, и ко га је последњи мењао. Скоро свака претрага их приказује
// као једну колону — иконицу са описом у облачићу — па и шема и приказ стоје овде.

export const sAuditUser = S_.Struct({ ime: S_.String, prezime: S_.String })
export type AuditUser = typeof sAuditUser.Type

export const sAudit = S_.Struct({
  korisnikKreirao: sAuditUser,
  datumKreiranja: S_.DateFromString,
  korisnikPromenio: S_.NullOr(sAuditUser),
  datumPromene: S_.NullOr(S_.DateFromString),
})
export type Audit = typeof sAudit.Type

export const renderUser = (user: AuditUser | null): string => (user === null ? '' : `${user.ime} ${user.prezime}`)

export const promenjen = (audit: Audit): boolean => audit.korisnikPromenio !== null || audit.datumPromene !== null

const pad2 = (n: number) => String(n).padStart(2, '0')

/** `dd.mm.yyyy HH:MM` — исти облик који и остатак апликације приказује. */
export const formatDatum = (value: Date | null): string =>
  value === null
    ? ''
    : `${pad2(value.getDate())}.${pad2(value.getMonth() + 1)}.${value.getFullYear()} ` +
      `${pad2(value.getHours())}:${pad2(value.getMinutes())}`

const useStyles = makeStyles({
  stack: { display: 'flex', flexDirection: 'column', rowGap: tokens.spacingVerticalM },
  trigger: { display: 'inline-flex', color: tokens.colorNeutralForeground3 },
})

export const AuditCell = ({ audit }: { readonly audit: Audit }) => {
  const styles = useStyles()

  return (
    <Tooltip
      relationship="label"
      withArrow
      positioning="after"
      showDelay={0}
      hideDelay={0}
      content={{
        children: (
          <div className={styles.stack}>
            <CardHeader
              image={<DocumentAdd20Regular />}
              header={
                <Caption1Strong>{t(popuni(S.audit.kreirao, { ko: renderUser(audit.korisnikKreirao) }))}</Caption1Strong>
              }
              description={
                <Caption2>{t(popuni(S.audit.datumKreiranja, { kad: formatDatum(audit.datumKreiranja) }))}</Caption2>
              }
            />
            {promenjen(audit) && (
              <CardHeader
                image={<DocumentEdit20Regular />}
                header={
                  <Caption1Strong>
                    {t(popuni(S.audit.izmenio, { ko: renderUser(audit.korisnikPromenio) }))}
                  </Caption1Strong>
                }
                description={
                  <Caption2>{t(popuni(S.audit.datumPromene, { kad: formatDatum(audit.datumPromene) }))}</Caption2>
                }
              />
            )}
          </div>
        ),
      }}
    >
      <span className={styles.trigger}>
        <PersonClock20Regular />
      </span>
    </Tooltip>
  )
}
