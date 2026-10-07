import { Body1, Button, Caption1, Card, Title2, makeStyles, tokens } from '@fluentui/react-components'
import { DocumentQuestionMarkRegular, HomeRegular } from '@fluentui/react-icons'

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

export const NotFoundView = ({ path }: { path: string }) => {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <DocumentQuestionMarkRegular className={styles.icon} />
        <Caption1 className={styles.code}>404</Caption1>
        <Title2>Strana ne postoji</Title2>
        <Body1>Adresa koju ste otvorili ne postoji ili je u medjuvremenu promenjena.</Body1>
        <Body1 className={styles.address}>{path}</Body1>
        <Button className={styles.button} appearance="primary" icon={<HomeRegular />} as="a" href="/">
          Idi na pocetnu
        </Button>
      </Card>
    </div>
  )
}
