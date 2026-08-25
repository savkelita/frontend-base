import { Caption1Strong, Caption2, CardHeader, Tooltip, makeStyles, tokens } from '@fluentui/react-components'
import { DocumentAdd20Regular, DocumentEdit20Regular, PersonClock20Regular } from '@fluentui/react-icons'
import * as DateTime from '../domain/date-time'
import { promenjen, renderUser, type Audit } from './audit'

const useStyles = makeStyles({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM,
  },
  trigger: {
    display: 'inline-flex',
    color: tokens.colorNeutralForeground3,
  },
})

const datum = (value: Date | null): string => (value === null ? '' : DateTime.format(value))

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
              header={<Caption1Strong>Kreirao/la {renderUser(audit.korisnikKreirao)}</Caption1Strong>}
              description={<Caption2>Datum kreiranja {datum(audit.datumKreiranja)}</Caption2>}
            />
            {promenjen(audit) && (
              <CardHeader
                image={<DocumentEdit20Regular />}
                header={<Caption1Strong>Izmenio/la {renderUser(audit.korisnikPromenio)}</Caption1Strong>}
                description={<Caption2>Datum poslednje promene {datum(audit.datumPromene)}</Caption2>}
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
