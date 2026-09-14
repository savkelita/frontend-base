import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { createRoot } from 'react-dom/client'
import { Effect } from 'effect'
import * as Navigation from 'tea-effect/Navigation'
import * as TeaReact from 'tea-effect/React'
import * as App from './router'
import { defaultGlobalStyles } from './common/theme'
import { ToastHost } from './common/toast/view'
import { greska } from './config'
import { GreskaKonfiguracije } from './config/greska-view'

const container = document.getElementById('root')!
const root = createRoot(container)

const Element = ({ dom }: { dom: TeaReact.Dom }) => {
  defaultGlobalStyles()
  return (
    <FluentProvider style={{ height: '100%' }} theme={webLightTheme}>
      {dom}
      <ToastHost />
    </FluentProvider>
  )
}

// Конфигурација се проверава пре свега осталог: без ње би апликација радила са погрешним
// префиксом и тражила backend на месту на ком га нема. Боље стати гласно.
const razlog = greska()
if (razlog !== undefined) {
  root.render(<GreskaKonfiguracije poruka={razlog} />)
} else {
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
}
