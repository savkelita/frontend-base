import {
  Menu,
  MenuButton,
  MenuItemRadio,
  MenuList,
  MenuPopover,
  MenuTrigger,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import type { ReactNode } from 'react'
import { operatorIcon, operatorLabel, type Operator } from '../../pretraga/operator'

export type OperatorMenuProps = {
  readonly operators: ReadonlyArray<Operator>
  readonly value: Operator
  readonly disabled: boolean
  readonly onChange: (operator: Operator) => void
}

const GROUP = 'operator'

const useStyles = makeStyles({
  button: {
    flexShrink: 0,
    minWidth: '55px',
    fontWeight: tokens.fontWeightRegular,
  },
})

export const OperatorMenu = ({ operators, value, disabled, onChange }: OperatorMenuProps): ReactNode => {
  const styles = useStyles()

  return (
    <Menu
      checkedValues={{ [GROUP]: [value] }}
      onCheckedValueChange={(_event, data) => onChange((data.checkedItems[0] ?? value) as Operator)}
    >
      <MenuTrigger disableButtonEnhancement>
        <MenuButton
          className={styles.button}
          disabled={disabled}
          aria-label={`Operator: ${operatorLabel[value]}`}
          title={operatorLabel[value]}
        >
          {operatorIcon(value)}
        </MenuButton>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {operators.map(one => (
            <MenuItemRadio key={one} name={GROUP} value={one}>
              {`${operatorIcon(one)}   ${operatorLabel[one]}`}
            </MenuItemRadio>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}
