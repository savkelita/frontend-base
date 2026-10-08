import { Subtitle2, Title3, makeStyles, tokens } from '@fluentui/react-components'
import type { ReactNode } from 'react'

export type PretragaLayoutProps = {
  readonly title: string
  readonly actions?: ReactNode
  readonly filter?: ReactNode
  readonly table: ReactNode
  readonly paging?: ReactNode
}

export type PretragaSectionProps = PretragaLayoutProps

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
    flexWrap: 'wrap',
    columnGap: tokens.spacingHorizontalM,
    rowGap: tokens.spacingVerticalS,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: tokens.spacingHorizontalS,
    rowGap: tokens.spacingVerticalS,
    '& > *': {
      flexShrink: 0,
    },
  },
  table: {
    flexGrow: 1,
    minHeight: 0,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM,
    minWidth: 0,
    flexGrow: 1,
    minHeight: 0,
  },
  sectionActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    columnGap: tokens.spacingHorizontalS,
    rowGap: tokens.spacingVerticalS,
  },
  sectionTable: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: '240px',
    '& > *': {
      flexGrow: 1,
      minHeight: 0,
    },
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

export const PretragaSection = ({ title, actions, filter, table, paging }: PretragaSectionProps): ReactNode => {
  const styles = useStyles()

  return (
    <section className={styles.section}>
      <Subtitle2>{title}</Subtitle2>
      {filter}
      {actions !== undefined && <div className={styles.sectionActions}>{actions}</div>}
      <div className={styles.sectionTable}>{table}</div>
      {paging}
    </section>
  )
}
