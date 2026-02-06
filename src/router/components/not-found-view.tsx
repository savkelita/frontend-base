import { Card, CardHeader, Title1, Text } from '@fluentui/react-components'

export const NotFoundView = ({ path }: { path: string }) => (
  <Card>
    <CardHeader header={<Title1>404</Title1>} />
    <Text>Page &quot;{path}&quot; not found</Text>
  </Card>
)
