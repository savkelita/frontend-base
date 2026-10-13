import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { Effect, Option } from 'effect'
import { createRoot } from 'react-dom/client'
import * as Navigation from 'tea-effect/Navigation'
import * as TeaReact from 'tea-effect/React'
import * as Debugger from './common/debugger'
import { env } from './common/env'
import { defaultGlobalStyles } from './common/theme'
import { ToastHost } from './common/toast/view'
import * as App from './router'

const container = document.getElementById('root')!
const root = createRoot(container)

const Element = ({ dom }: { dom: TeaReact.Dom }) => {
  defaultGlobalStyles()
  return (
    <FluentProvider theme={webLightTheme}>
      {dom}
      <ToastHost />
    </FluentProvider>
  )
}

const config = {
  init: App.init,
  update: App.update,
  view: App.view,
  subscriptions: App.subscriptions,
  onUrlRequest: App.onUrlRequest,
  onUrlChange: App.onUrlChange,
}

const debuggerOptions: Debugger.Options = {
  build: env.build,
  maxAge: 200,
  actionsDenylist: ['SessionExpiration/Tick'],
}

const render = (dom: TeaReact.Dom) => root.render(<Element dom={dom} />)

Effect.runPromise(
  Option.match(Debugger.extension(), {
    onNone: () => TeaReact.run(Navigation.program(config), render),
    onSome: extension => TeaReact.run(Debugger.program(extension, debuggerOptions, config), render),
  }),
)
