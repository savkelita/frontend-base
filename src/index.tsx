import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { createRoot } from 'react-dom/client'
import { Effect } from 'effect'
import * as Navigation from 'tea-effect/Navigation'
import * as TeaReact from 'tea-effect/React'
import * as App from './router'
import { defaultGlobalStyles } from './common/theme'

const container = document.getElementById('root')!
const root = createRoot(container)

const Element = ({ dom }: { dom: TeaReact.Dom }) => {
  defaultGlobalStyles()
  return (
    <FluentProvider style={{ height: '100%' }} theme={webLightTheme}>
      {dom}
    </FluentProvider>
  )
}

Effect.runPromise(
  TeaReact.run(
    Navigation.program({
      init: App.init,
      update: App.update,
      view: App.view,
      subscriptions: App.subscriptions,
      onUrlRequest: App.onUrlRequest,
      onUrlChange: App.onUrlChange,
    }),
    dom => root.render(<Element dom={dom} />),
  ),
)
