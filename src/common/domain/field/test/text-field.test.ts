import { Schema } from 'effect'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { render, type Options } from '../../../form'
import * as Name from '../../name'
import type { TextFieldOptions } from '../text-field'

type Value = { readonly x: Name.Form }

const draw = (field: TextFieldOptions & Record<string, unknown>) => {
  const options: Options<Value> = { template: l => l.inputs.x, fields: { x: field } }
  return renderToStaticMarkup(
    render({
      schema: Schema.Struct({ x: Name.vForm }),
      value: { x: null },
      onChange: () => {},
      options,
    }) as never,
  )
}

describe('text-field', () => {
  it('should mask the input when the screen asks for it', () => {
    expect(draw({ type: 'password' })).toContain('type="password"')
  })

  it('should render plain text by default', () => {
    expect(draw({})).toContain('type="text"')
  })

  it('gasi autofill osim ako ekran ne kaze drugacije', () => {
    expect(draw({})).toMatch(/autocomplete="off"/i)
  })

  it('ekran sme da trazi autofill, zbog prijave', () => {
    expect(draw({ autoComplete: 'username' })).toMatch(/autocomplete="username"/i)
  })
})
