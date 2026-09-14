import { MessageBar, MessageBarActions, MessageBarBody, Text } from '@fluentui/react-components'
import type { ReactNode } from 'react'
import type { ErrorReport } from './report'

export type ErrorViewProps = {
  readonly report: ErrorReport
  readonly actions?: ReactNode
}

export const ErrorView = ({ report, actions }: ErrorViewProps): ReactNode => (
  <MessageBar intent={report.severity === 'WARNING' ? 'warning' : 'error'}>
    <MessageBarBody>
      {report.messages.map((message, i) => (
        <Text block key={`${i}-${message}`}>
          {message}
        </Text>
      ))}
    </MessageBarBody>
    {actions !== undefined && <MessageBarActions>{actions}</MessageBarActions>}
  </MessageBar>
)
