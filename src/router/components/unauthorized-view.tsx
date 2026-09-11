import { Card, CardHeader, Title1, Text } from '@fluentui/react-components'
import { S, popuni, t } from '../../common/strings'

export const UnauthorizedView = ({ path }: { path: string }) => (
  <Card>
    <CardHeader header={<Title1>{401}</Title1>} />
    <Text>{t(popuni(S.ljuska.bezPrava, { putanja: path }))}</Text>
  </Card>
)
