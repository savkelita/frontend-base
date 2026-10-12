import {
  Avatar,
  Hamburger,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Persona,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { SignOutRegular } from '@fluentui/react-icons'
import { memo } from 'react'
import type * as Platform from 'tea-effect/Platform'
import * as Nav from '../../navigation'
import { logout, navigation } from '../msg'
import type { Msg } from '../msg'

const NARROW = '(max-width: 640px)'

const useStyles = makeStyles({
  actions: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalSNudge,
    paddingLeft: tokens.spacingHorizontalXS,
    borderRadius: tokens.borderRadiusCircular,
    minWidth: 0,
  },
  ime: {
    maxWidth: '180px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    [`@media ${NARROW}`]: {
      display: 'none',
    },
  },
  nalog: {
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL} ${tokens.spacingVerticalS}`,
  },
})

const KorisnikBadge = ({
  username,
  uloga,
  dispatch,
}: {
  username: string
  uloga: string
  dispatch: Platform.Dispatch<Msg>
}) => {
  const styles = useStyles()

  return (
    <Menu positioning="below-end">
      <MenuTrigger disableButtonEnhancement>
        <MenuButton appearance="subtle" className={styles.badge} aria-label={`Nalog korisnika ${username}`}>
          <Avatar name={username} color="colorful" size={28} />
          <span className={styles.ime}>{username}</span>
        </MenuButton>
      </MenuTrigger>

      <MenuPopover>
        <div className={styles.nalog}>
          <Persona name={username} secondaryText={uloga} size="large" avatar={{ name: username, color: 'colorful' }} />
        </div>
        <MenuDivider />
        <MenuList>
          <MenuItem icon={<SignOutRegular />} onClick={() => dispatch(logout())}>
            Odjavi se
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}

export const AppHeader = memo(
  ({
    isOpen,
    username,
    uloga,
    dispatch,
  }: {
    isOpen: boolean
    username: string
    uloga: string
    dispatch: Platform.Dispatch<Msg>
  }) => {
    const styles = useStyles()
    return (
      <>
        <Hamburger onClick={() => dispatch(navigation(Nav.toggleDrawer(!isOpen)))} />
        <Text weight="semibold">frontend-base</Text>
        <div className={styles.actions}>
          <KorisnikBadge username={username} uloga={uloga} dispatch={dispatch} />
        </div>
      </>
    )
  },
)
