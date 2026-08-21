import { Button, Text, Tooltip, makeStyles, tokens } from '@fluentui/react-components'
import {
  ChevronDoubleLeftRegular,
  ChevronDoubleRightRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
} from '@fluentui/react-icons'
import { memo, type ReactElement, type ReactNode } from 'react'
import { isLoading, total, type Data } from './data'

export type PagingProps<A> = {
  readonly data: Data<A>
  readonly offset: number
  readonly limit: number
  readonly onOffset: (offset: number) => void
}

const useStyles = makeStyles({
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: tokens.spacingHorizontalM,
    paddingLeft: tokens.spacingHorizontalXS,
    paddingRight: tokens.spacingHorizontalXS,
  },
  range: {
    color: tokens.colorNeutralForeground3,
    fontVariantNumeric: 'tabular-nums',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXXS,
  },
  page: {
    minWidth: '104px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground2,
    fontVariantNumeric: 'tabular-nums',
  },
})

const range = (offset: number, limit: number, count: number): string =>
  `${offset + 1}-${Math.min(offset + limit, count)} od ${count}`

const Step = ({
  label,
  icon,
  disabled,
  onClick,
}: {
  readonly label: string
  readonly icon: ReactElement
  readonly disabled: boolean
  readonly onClick: () => void
}): ReactNode => (
  <Tooltip content={label} relationship="label" withArrow>
    <Button appearance="subtle" size="small" icon={icon} disabled={disabled} onClick={onClick} />
  </Tooltip>
)

const PagingView = <A,>({ data, offset, limit, onOffset }: PagingProps<A>) => {
  const styles = useStyles()
  const count = total(data)
  const disabled = isLoading(data)
  if (count === 0) return null

  const last = Math.max(0, Math.ceil(count / limit) - 1)
  const current = Math.floor(offset / limit)

  return (
    <div className={styles.bar}>
      <Text className={styles.range}>{range(offset, limit, count)}</Text>
      {last > 0 && (
        <div className={styles.nav}>
          <Step
            label="Prva strana"
            icon={<ChevronDoubleLeftRegular />}
            disabled={disabled || current === 0}
            onClick={() => onOffset(0)}
          />
          <Step
            label="Prethodna strana"
            icon={<ChevronLeftRegular />}
            disabled={disabled || current === 0}
            onClick={() => onOffset((current - 1) * limit)}
          />
          <Text className={styles.page}>
            Strana {current + 1} od {last + 1}
          </Text>
          <Step
            label="Sledeca strana"
            icon={<ChevronRightRegular />}
            disabled={disabled || current >= last}
            onClick={() => onOffset((current + 1) * limit)}
          />
          <Step
            label="Poslednja strana"
            icon={<ChevronDoubleRightRegular />}
            disabled={disabled || current >= last}
            onClick={() => onOffset(last * limit)}
          />
        </div>
      )}
    </div>
  )
}

export const Paging = memo(PagingView) as typeof PagingView
