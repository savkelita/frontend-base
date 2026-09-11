import { Menu, MenuButton, MenuItemRadio, MenuList, MenuPopover, MenuTrigger } from '@fluentui/react-components'
import { LocalLanguageRegular } from '@fluentui/react-icons'
import type * as Platform from 'tea-effect/Platform'
import type { Pismo } from '../../common/strings'
import { S, t } from '../../common/strings'
import { promeniPismo } from '../msg'
import type { Msg } from '../msg'

// Прекидач стоји и на пријави и у заглављу: писмо се бира и пре него што корисник уђе.
export const PismoSwitch = ({
  pismo,
  dispatch,
}: {
  readonly pismo: Pismo
  readonly dispatch: Platform.Dispatch<Msg>
}) => (
  <Menu
    checkedValues={{ pismo: [pismo] }}
    onCheckedValueChange={(_e, { checkedItems }) => {
      const izabrano = checkedItems[0]
      if (izabrano === 'cirilica' || izabrano === 'latinica') dispatch(promeniPismo(izabrano))
    }}
  >
    <MenuTrigger disableButtonEnhancement>
      <MenuButton appearance="subtle" icon={<LocalLanguageRegular />} aria-label={t(S.pismo.izbor)}>
        {pismo === 'cirilica' ? t(S.pismo.cirilica) : t(S.pismo.latinica)}
      </MenuButton>
    </MenuTrigger>
    <MenuPopover>
      <MenuList>
        <MenuItemRadio name="pismo" value="cirilica">
          {t(S.pismo.cirilica)}
        </MenuItemRadio>
        <MenuItemRadio name="pismo" value="latinica">
          {t(S.pismo.latinica)}
        </MenuItemRadio>
      </MenuList>
    </MenuPopover>
  </Menu>
)
