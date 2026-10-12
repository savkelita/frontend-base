import { Body1, Button, Caption1, Card, Title2, makeStyles, tokens } from '@fluentui/react-components'
import { HomeRegular, ShieldProhibitedRegular } from '@fluentui/react-icons'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    padding: tokens.spacingVerticalXXL,
  },
  card: {
    width: '440px',
    maxWidth: '100%',
    alignItems: 'center',
    textAlign: 'center',
    rowGap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalXXL,
  },
  icon: {
    fontSize: '48px',
    color: tokens.colorNeutralForeground4,
  },
  code: {
    color: tokens.colorNeutralForeground3,
  },
  address: {
    color: tokens.colorNeutralForeground3,
    overflowWrap: 'anywhere',
  },
  button: {
    marginTop: tokens.spacingVerticalM,
  },
})

export const UnauthorizedView = ({ path }: { path: string }) => {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <ShieldProhibitedRegular className={styles.icon} />
        <Caption1 className={styles.code}>401</Caption1>
        <Title2>Nemate pravo pristupa</Title2>
        <Body1>Ova strana trazi ovlascenje koje vas nalog nema. Obratite se administratoru.</Body1>
        <Body1 className={styles.address}>{path}</Body1>
        <Button className={styles.button} appearance="primary" icon={<HomeRegular />} as="a" href="/">
          Idi na pocetnu
        </Button>
      </Card>
    </div>
  )
}
