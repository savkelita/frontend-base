import { Card, CardHeader, Title1, Text } from '@fluentui/react-components'
import { S, popuni, t } from '../../common/strings'

export const NotFoundView = ({ path }: { path: string }) => (
  <Card>
    <CardHeader header={<Title1>{404}</Title1>} />
    <Text>{t(popuni(S.ljuska.nemaStranice, { putanja: path }))}</Text>
  </Card>
)
