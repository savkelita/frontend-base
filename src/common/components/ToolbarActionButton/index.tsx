import { Button, tokens } from '@fluentui/react-components'
import type { ButtonProps } from '@fluentui/react-components'
import { forwardRef } from 'react'
import type { ReactNode } from 'react'

// -------------------------------------------------------------------------------------
// Дугме радње на траци
// -------------------------------------------------------------------------------------
//
// Портовано из затечених пројеката, где стоји под истим именом и на истој путањи. Радња
// не бира изглед него **улогу**; из улоге се изводе и `appearance` и боја иконице. Тако
// брисање изгледа исто у сваком модулу, а екран не мора да зна која је то нијанса црвене.

export type ToolbarActionKind =
  | 'primaryCreate'
  | 'positiveFlow'
  | 'neutralWork'
  | 'caution'
  | 'destructive'
  | 'outbound'

const appearanceForKind = (kind: ToolbarActionKind): NonNullable<ButtonProps['appearance']> => {
  switch (kind) {
    case 'primaryCreate':
      return 'primary'
    case 'positiveFlow':
    case 'neutralWork':
    case 'outbound':
      return 'secondary'
    case 'caution':
    case 'destructive':
      return 'subtle'
  }
}

const iconColorForKind = (kind: ToolbarActionKind): string | undefined => {
  switch (kind) {
    case 'primaryCreate':
      return undefined
    case 'positiveFlow':
      return tokens.colorPaletteGreenForeground1
    case 'neutralWork':
      return tokens.colorNeutralForeground2
    case 'caution':
      return tokens.colorPaletteDarkOrangeForeground1
    case 'destructive':
      return tokens.colorPaletteRedForeground1
    case 'outbound':
      return tokens.colorPaletteBlueForeground2
  }
}

const wrapIcon = (icon: ReactNode, color: string | undefined): ReactNode =>
  icon == null || color == null ? (
    icon
  ) : (
    <span style={{ color, display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
  )

export type ToolbarActionButtonProps = Omit<
  ButtonProps,
  'appearance' | 'size' | 'iconPosition' | 'icon' | 'as' | 'href'
> & {
  readonly kind: ToolbarActionKind
  readonly icon?: ReactNode
}

/**
 * Иконица уз видљив текст, уједначен изглед и семантичка боја. `ref` иде до Fluent дугмета,
 * да `MenuTrigger` и слични слојеви умеју да позиционирају мени.
 */
export const ToolbarActionButton = forwardRef<HTMLButtonElement, ToolbarActionButtonProps>(
  ({ kind, icon, children, ...rest }, ref) => (
    <Button
      ref={ref}
      appearance={appearanceForKind(kind)}
      size="medium"
      iconPosition="before"
      icon={wrapIcon(icon, iconColorForKind(kind)) as ButtonProps['icon']}
      {...(rest as ButtonProps)}
    >
      {children}
    </Button>
  ),
)

ToolbarActionButton.displayName = 'ToolbarActionButton'
