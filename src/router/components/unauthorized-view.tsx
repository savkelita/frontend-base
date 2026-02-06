import { Card, CardHeader, Title1, Text } from '@fluentui/react-components'

export const UnauthorizedView = ({ path }: { path: string }) => (
  <Card>
    <CardHeader header={<Title1>401</Title1>} />
    <Text>You do not have permission to access &quot;{path}&quot;</Text>
  </Card>
)
