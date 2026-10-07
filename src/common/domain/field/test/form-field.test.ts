import { Schema } from 'effect'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { render, type Options } from '../../../form'
import * as BooleanDomain from '../../boolean'
import * as DateDomain from '../../date'
import * as DateRange from '../../date-range'
import * as Email from '../../email'
import * as Enum from '../../enum'
import * as FileDomain from '../../file'
import * as Name from '../../name'
import * as Telefon from '../../phone'

const LABELABLE = ['button', 'input', 'meter', 'output', 'progress', 'select', 'textarea']

const draw = (schema: Schema.Schema.Any): string => {
  const options: Options<{ readonly x: unknown }> = {
    template: l => l.inputs.x,
    fields: { x: { label: 'Polje' } },
  }
  return renderToStaticMarkup(
    render({ schema: Schema.Struct({ x: schema }), value: { x: null }, onChange: () => {}, options }) as never,
  )
}

const labelFor = (markup: string): string | undefined => markup.match(/<label[^>]*\bfor="([^"]*)"/)?.[1]

const owner = (markup: string, id: string): string | undefined =>
  markup.match(new RegExp(`<([a-z]+)(?=[^>]*\\bid="${id}")`))?.[1]

const FIELDS: ReadonlyArray<readonly [string, Schema.Schema.Any]> = [
  ['tekst', Name.vForm],
  ['e-mail', Email.vForm],
  ['telefon', Telefon.vForm],
  ['datum', DateDomain.vForm],
  ['opseg datuma', DateRange.vForm],
  ['da/ne', BooleanDomain.vForm],
  ['sifarnik', Enum.vForm({ a: 'A', b: 'B' })],
  ['sifarnik sa vise izbora', Enum.vFormMulti({ a: 'A', b: 'B' })],
  ['fajl', FileDomain.vForm],
]

describe('veza labele i kontrole', () => {
  for (const [label, schema] of FIELDS) {
    it(`${label}: for pokazuje na kontrolu koja sme da nosi labelu`, () => {
      const markup = draw(schema)
      const target = labelFor(markup)
      expect(target).toBeDefined()
      expect(LABELABLE).toContain(owner(markup, target!))
    })
  }
})
