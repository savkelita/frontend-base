import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import type { ReactNode } from 'react'

// -------------------------------------------------------------------------------------
// Распоред
// -------------------------------------------------------------------------------------
//
// Замена за `Stack` из Fluent-а 8, али намерно мања. Тамошњи `tokens={{ childrenGap }}` и
// `Stack.Item grow` су CSS преписан у пропове; овде постоји само оно што се у екранима
// заиста понавља — правац, размак из токена, поравнање.
//
// Размак је списак а не број: griffel тражи статичне стилове, а уз то ниједан екран не сме
// да измишља своју величину размака.

export type Razmak = 'none' | 'xs' | 's' | 'm' | 'l' | 'xl'

const useStyles = makeStyles({
  osnova: { display: 'flex', minWidth: 0 },
  red: { flexDirection: 'row' },
  kolona: { flexDirection: 'column' },
  prelama: { flexWrap: 'wrap' },
  raste: { flexGrow: 1 },

  // Водораван и усправан размак имају различите токене, па и различите класе.
  redNone: { gap: 0 },
  redXs: { gap: tokens.spacingHorizontalXS },
  redS: { gap: tokens.spacingHorizontalS },
  redM: { gap: tokens.spacingHorizontalM },
  redL: { gap: tokens.spacingHorizontalL },
  redXl: { gap: tokens.spacingHorizontalXXL },

  kolonaNone: { gap: 0 },
  kolonaXs: { gap: tokens.spacingVerticalXS },
  kolonaS: { gap: tokens.spacingVerticalS },
  kolonaM: { gap: tokens.spacingVerticalM },
  kolonaL: { gap: tokens.spacingVerticalL },
  kolonaXl: { gap: tokens.spacingVerticalXXL },

  poravnajStart: { alignItems: 'flex-start' },
  poravnajCenter: { alignItems: 'center' },
  poravnajEnd: { alignItems: 'flex-end' },
  poravnajStretch: { alignItems: 'stretch' },
  poravnajBaseline: { alignItems: 'baseline' },

  rasporediStart: { justifyContent: 'flex-start' },
  rasporediCenter: { justifyContent: 'center' },
  rasporediEnd: { justifyContent: 'flex-end' },
  rasporediBetween: { justifyContent: 'space-between' },
})

type Stilovi = ReturnType<typeof useStyles>

const razmakKlasa = (s: Stilovi, uspravno: boolean, razmak: Razmak): string => {
  const po: Record<Razmak, [string, string]> = {
    none: [s.redNone, s.kolonaNone],
    xs: [s.redXs, s.kolonaXs],
    s: [s.redS, s.kolonaS],
    m: [s.redM, s.kolonaM],
    l: [s.redL, s.kolonaL],
    xl: [s.redXl, s.kolonaXl],
  }
  return po[razmak][uspravno ? 1 : 0]
}

export type Poravnanje = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
export type Raspored = 'start' | 'center' | 'end' | 'between'

export type StackProps = {
  /** Усправно ређање; подразумевано је водоравно. */
  readonly vertical?: boolean
  readonly gap?: Razmak
  /** Попречно поравнање (`align-items`). */
  readonly align?: Poravnanje
  /** Ређање по главној оси (`justify-content`). */
  readonly justify?: Raspored
  readonly wrap?: boolean
  /** Заузми преостали простор родитеља. */
  readonly grow?: boolean
  readonly className?: string
  readonly children?: ReactNode
}

export const Stack = ({ vertical = false, gap = 'm', align, justify, wrap, grow, className, children }: StackProps) => {
  const s = useStyles()
  return (
    <div
      className={mergeClasses(
        s.osnova,
        vertical ? s.kolona : s.red,
        razmakKlasa(s, vertical, gap),
        align === 'start' && s.poravnajStart,
        align === 'center' && s.poravnajCenter,
        align === 'end' && s.poravnajEnd,
        align === 'stretch' && s.poravnajStretch,
        align === 'baseline' && s.poravnajBaseline,
        justify === 'start' && s.rasporediStart,
        justify === 'center' && s.rasporediCenter,
        justify === 'end' && s.rasporediEnd,
        justify === 'between' && s.rasporediBetween,
        wrap === true && s.prelama,
        grow === true && s.raste,
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * Гурне оно што следи на крај реда. Замена за `Stack.Item grow` из Fluent-а 8 — само за
 * потискивање, јер је то једино за шта се тамо стварно и користио.
 */
export const Spacer = () => {
  const s = useStyles()
  return <div className={s.raste} />
}

/**
 * Трака радњи: место где стоје `ToolbarActionButton`-и. Именована је, а не гола `Stack`,
 * јер размак међу дугмадима није ствар екрана — исти је свуда, и мења се на једном месту.
 */
export const Toolbar = ({ children, className }: { readonly children?: ReactNode; readonly className?: string }) => (
  <Stack gap="s" align="center" className={className}>
    {children}
  </Stack>
)
