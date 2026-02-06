import { Spinner, makeStyles } from '@fluentui/react-components'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
})

export const LoadingView = () => {
  const styles = useStyles()
  return (
    <div className={styles.root}>
      <Spinner label="Loading..." />
    </div>
  )
}
