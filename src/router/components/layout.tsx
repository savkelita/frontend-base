import { makeStyles, tokens } from '@fluentui/react-components'
import type { ReactNode } from 'react'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: tokens.spacingHorizontalXXL,
    overflowY: 'auto',
  },
})

export const Layout = ({ header, nav, children }: { header: ReactNode; nav: ReactNode; children: ReactNode }) => {
  const styles = useStyles()
  return (
    <div className={styles.root}>
      <div className={styles.header}>{header}</div>
      <div className={styles.body}>
        {nav}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
