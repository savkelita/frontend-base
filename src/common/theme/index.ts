import { makeStaticStyles } from '@fluentui/react-components'

export const defaultGlobalStyles = makeStaticStyles({
  '*': {
    margin: 0,
    padding: 0,
  },
  'html, body, #root': {
    height: '100%',
  },
})
