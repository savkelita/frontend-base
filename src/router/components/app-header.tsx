import { Hamburger, Text, Button, makeStyles, tokens } from '@fluentui/react-components'
import { SignOutRegular } from '@fluentui/react-icons'
import { memo } from 'react'
import type * as Platform from 'tea-effect/Platform'
import { navigation, logout } from '../msg'
import type { Msg } from '../msg'
import * as Nav from '../../navigation'

const useStyles = makeStyles({
  actions: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
})

export const AppHeader = memo(
  ({ isOpen, username, dispatch }: { isOpen: boolean; username: string; dispatch: Platform.Dispatch<Msg> }) => {
    const styles = useStyles()
    return (
      <>
        <Hamburger onClick={() => dispatch(navigation(Nav.toggleDrawer(!isOpen)))} />
        <Text weight="semibold">frontend-base</Text>
        <div className={styles.actions}>
          <Text>{username}</Text>
          <Button appearance="subtle" icon={<SignOutRegular />} onClick={() => dispatch(logout())}>
            Logout
          </Button>
        </div>
      </>
    )
  },
)
