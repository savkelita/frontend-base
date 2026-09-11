import { Button, Text, makeStyles, tokens } from '@fluentui/react-components'
import { ChevronLeftRegular, ChevronRightRegular } from '@fluentui/react-icons'
import { S, popuni, t } from '../strings'

// -------------------------------------------------------------------------------------
// Страничење
// -------------------------------------------------------------------------------------

const useStyles = makeStyles({
  koren: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
  },
  brojac: { fontVariantNumeric: 'tabular-nums', color: tokens.colorNeutralForeground2 },
})

export type PaginacijaProps = {
  readonly offset: number
  readonly limit: number
  readonly ukupno: number
  readonly onStrana: (offset: number) => void
}

export const Paginacija = ({ offset, limit, ukupno, onStrana }: PaginacijaProps) => {
  const styles = useStyles()
  if (ukupno === 0) return null

  const prvi = offset + 1
  const poslednji = Math.min(offset + limit, ukupno)

  return (
    <div className={styles.koren}>
      <Text className={styles.brojac}>{t(popuni(S.lista.opseg, { prvi, poslednji, ukupno }))}</Text>
      <Button
        appearance="subtle"
        icon={<ChevronLeftRegular />}
        disabled={offset === 0}
        aria-label={t(S.lista.prethodna)}
        onClick={() => onStrana(Math.max(0, offset - limit))}
      />
      <Button
        appearance="subtle"
        icon={<ChevronRightRegular />}
        disabled={poslednji >= ukupno}
        aria-label={t(S.lista.sledeca)}
        onClick={() => onStrana(offset + limit)}
      />
    </div>
  )
}
