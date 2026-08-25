import { Schema } from 'effect'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { render, type Options } from '../../../form'
import * as Enum from '../../enum'
import { clearing } from '../dropdown-field'

const CHOICES = [
  { value: 'read', text: 'Read' },
  { value: 'write', text: 'Write' },
] as const

const single = Enum.vForm(CHOICES)
const multi = Enum.vFormMulti(CHOICES)

const draw = <A, I, R>(schema: Schema.Schema<A, I, R>, x: unknown) => {
  const options: Options<{ readonly x: unknown }> = { template: l => l.inputs.x }
  return renderToStaticMarkup(
    render({ schema: Schema.Struct({ x: schema }), value: { x }, onChange: () => {}, options }) as never,
  )
}

describe('dropdown-field', () => {
  // Fluent prijavljuje gresku iz `useEffect`-a, koji pod SSR-om ne izvrsi — zato se
  // proverava sama odluka, a ne iscrtani HTML.
  it('should not pass clearable in multiselect mode', () => {
    expect(clearing({ multiselect: true })).toEqual({})
    expect(clearing({ multiselect: true, clearable: true })).toEqual({})
  })

  it('should pass clearable for a single selection', () => {
    expect(clearing({ multiselect: false })).toEqual({ clearable: true })
    expect(clearing({ multiselect: false, clearable: false })).toEqual({ clearable: false })
  })

  it('should draw the selected texts', () => {
    expect(draw(multi, ['read', 'write'])).toContain('Read, Write')
  })

  it('should draw a single selection', () => {
    expect(draw(single, 'write')).toContain('Write')
  })
})
