import { Title3, makeStyles, tokens } from '@fluentui/react-components'
import type { ReactNode } from 'react'

export type PretragaLayoutProps = {
  readonly title: string
  readonly actions?: ReactNode
  readonly filter?: ReactNode
  readonly table: ReactNode
  readonly paging: ReactNode
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    height: '100%',
    overflow: 'hidden',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minWidth: 0,
    rowGap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalXXL,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: tokens.spacingHorizontalM,
  },
  actions: {
    display: 'flex',
    columnGap: tokens.spacingHorizontalS,
  },
  table: {
    flexGrow: 1,
    minHeight: 0,
  },
})

export const PretragaLayout = ({ title, actions, filter, table, paging }: PretragaLayoutProps): ReactNode => {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <div className={styles.main}>
        <div className={styles.header}>
          <Title3>{title}</Title3>
          {actions !== undefined && <div className={styles.actions}>{actions}</div>}
        </div>
        <div className={styles.table}>{table}</div>
        {paging}
      </div>
      {filter}
    </div>
  )
}
