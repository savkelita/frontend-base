import { fluentProviderClassNames, makeStaticStyles } from '@fluentui/react-components'

export const defaultGlobalStyles = makeStaticStyles({
  '*': {
    margin: 0,
    padding: 0,
  },
  '*, *::before, *::after': {
    boxSizing: 'border-box',
  },
  'html, body, #root': {
    height: '100%',
  },
  [`#root > .${fluentProviderClassNames.root}`]: {
    height: '100%',
  },
})
