import { Hamburger, Text, Button, makeStyles, tokens } from '@fluentui/react-components'
import { SignOutRegular } from '@fluentui/react-icons'
import { memo } from 'react'
import type * as Platform from 'tea-effect/Platform'
import { navigation, logout } from '../msg'
import type { Msg } from '../msg'
import * as Nav from '../../navigation'
import type { Pismo } from '../../common/strings'
import { S, t } from '../../common/strings'
import { PismoSwitch } from './pismo-switch'

const useStyles = makeStyles({
  actions: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
})

export const AppHeader = memo(
  ({
    isOpen,
    username,
    pismo,
    dispatch,
  }: {
    isOpen: boolean
    username: string
    pismo: Pismo
    dispatch: Platform.Dispatch<Msg>
  }) => {
    const styles = useStyles()
    return (
      <>
        <Hamburger onClick={() => dispatch(navigation(Nav.toggleDrawer(!isOpen)))} />
        <Text weight="semibold">{t(S.ljuska.naziv)}</Text>
        <div className={styles.actions}>
          <PismoSwitch pismo={pismo} dispatch={dispatch} />
          <Text>{username}</Text>
          <Button appearance="subtle" icon={<SignOutRegular />} onClick={() => dispatch(logout())}>
            {t(S.opste.odjava)}
          </Button>
        </div>
      </>
    )
  },
)
