import { MessageBar, MessageBarActions, MessageBarBody } from '@fluentui/react-components'
import type { ReactNode } from 'react'
import type { ErrorReport } from './tipovi'

// -------------------------------------------------------------------------------------
// Приказ грешке
// -------------------------------------------------------------------------------------
//
// Свака грешка се исписује исто, и упозорење се разликује од грешке бојом а не текстом.
// Раније је сваки екран градио свој `MessageBar` — што значи да је сваки могао да заборави
// разлику између `ERROR` и `WARNING`.

export type ErrorViewProps = {
  readonly report: ErrorReport
  /** Дугмад уз поруку — „Покушај поново", „Освежи". */
  readonly actions?: ReactNode
}

export const ErrorView = ({ report, actions }: ErrorViewProps) => (
  <MessageBar intent={report.severity === 'WARNING' ? 'warning' : 'error'}>
    <MessageBarBody>{report.message}</MessageBarBody>
    {actions !== undefined && <MessageBarActions>{actions}</MessageBarActions>}
  </MessageBar>
)
