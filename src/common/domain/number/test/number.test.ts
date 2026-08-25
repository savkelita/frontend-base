import { Schema } from 'effect'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import * as Form from '../../../form'
import * as Decimal from '../../decimal'
import { accepts, canonical, editable, format, normalize } from '../../field/number-field'
import * as Int from '../../int'
import type * as NumberDomain from '../index'

const check = <A, I, R>(schema: Schema.Schema<A, I, R>, value: NumberDomain.Form) =>
  Form.validate(() => Schema.Struct({ x: schema }), { x: value })

const decoded = <A, I, R>(schema: Schema.Schema<A, I, R>, value: NumberDomain.Form) => {
  const r = check(schema, value)
  return r.isValid ? (r.value as { readonly x: number }).x : undefined
}

const message = <A, I, R>(schema: Schema.Schema<A, I, R>, value: NumberDomain.Form) => {
  const r = check(schema, value)
  return r.isValid ? undefined : r.issues[0]?.message
}

// Srpski zapis: zarez je decimalni, tacka hiljadna.
describe('canonical form on blur', () => {
  it('should group thousands with a dot', () => {
    expect(canonical('12000', 2)).toBe('12.000,00')
    expect(canonical('1234567,891', 2)).toBe('1.234.567,89')
  })

  it('should pad to the full number of decimals', () => {
    expect(canonical('4', 2)).toBe('4,00')
    expect(canonical('4,5', 2)).toBe('4,50')
  })

  it('should round away the extra decimals', () => {
    expect(canonical('4,256', 2)).toBe('4,26')
    expect(canonical('4,254', 2)).toBe('4,25')
  })

  it('should finish an unfinished entry', () => {
    expect(canonical('4,', 2)).toBe('4,00')
  })

  it('should group an int without a decimal part', () => {
    expect(canonical('12000', 0)).toBe('12.000')
    expect(canonical('007', 0)).toBe('7')
  })

  it('should keep the sign', () => {
    expect(canonical('-12000', 2)).toBe('-12.000,00')
  })

  it('should leave an empty field alone', () => {
    expect(canonical(null, 2)).toBe(null)
    expect(canonical('', 2)).toBe('')
  })

  it('should leave a value it cannot read untouched', () => {
    expect(canonical('-', 2)).toBe('-')
  })

  it('should stay put when formatted again', () => {
    expect(canonical(canonical('12000', 2), 2)).toBe('12.000,00')
  })
})

// Ono sto stigne u polje se svodi na goli broj, pa nema dvosmislenosti tacke.
describe('editable form', () => {
  it('should read a dot as the decimal comma', () => {
    expect(editable('4.25')).toBe('4,25')
  })

  it('should read a fully grouped value as thousands', () => {
    expect(editable('12.000,00')).toBe('12000,00')
    expect(editable('1.234.567')).toBe('1234567')
  })

  it('should leave a plain entry alone', () => {
    expect(editable('4,25')).toBe('4,25')
    expect(editable('42')).toBe('42')
  })
})

describe('typing', () => {
  const takes = (decimals: number, text: string) => accepts(decimals).test(editable(text))

  it('should refuse letters', () => {
    expect(takes(0, 'sssss')).toBe(false)
    expect(takes(2, 'sssss')).toBe(false)
    expect(takes(0, '4a')).toBe(false)
  })

  it('should refuse a decimal part in an int field', () => {
    expect(takes(0, '4,2')).toBe(false)
    expect(takes(0, '4.2')).toBe(false)
  })

  it('should allow an unfinished entry', () => {
    expect(takes(2, '')).toBe(true)
    expect(takes(2, '-')).toBe(true)
    expect(takes(2, '4,')).toBe(true)
  })

  it('should allow more decimals than the type holds, to round on blur', () => {
    expect(takes(2, '4,256')).toBe(true)
  })

  it('should allow pasting a grouped value', () => {
    expect(takes(2, '12.000,00')).toBe(true)
    expect(takes(0, '12.000')).toBe(true)
  })
})

describe('int', () => {
  it('should decode a whole number', () => {
    expect(decoded(Int.vForm, '42')).toBe(42)
  })

  it('should decode a grouped number', () => {
    expect(decoded(Int.vForm, '12.000')).toBe(12000)
  })

  it('should decode a negative number', () => {
    expect(decoded(Int.vForm, '-7')).toBe(-7)
  })

  it('should refuse a decimal', () => {
    expect(message(Int.vForm, '4,2')).toBe('Unesite ceo broj')
  })

  it('should refuse text', () => {
    expect(message(Int.vForm, 'abc')).toBe('Unesite ceo broj')
  })

  it('should refuse an empty field', () => {
    expect(message(Int.vForm, null)).toBe('Podatak je obavezan')
    expect(message(Int.vForm, '   ')).toBe('Podatak je obavezan')
  })
})

describe('decimal', () => {
  it('should decode a whole number', () => {
    expect(decoded(Decimal.vForm, '42')).toBe(42)
  })

  it('should decode the canonical form', () => {
    expect(decoded(Decimal.vForm, '12.000,00')).toBe(12000)
  })

  it('should decode two decimal places', () => {
    expect(decoded(Decimal.vForm, '4,25')).toBe(4.25)
  })

  // Zaokruzuje i shema, ne samo widget — vrednost ne zavisi od toga da li je bilo blur-a.
  it('should round away the extra decimals', () => {
    expect(decoded(Decimal.vForm, '4,256')).toBe(4.26)
  })

  it('should refuse text', () => {
    expect(message(Decimal.vForm, 'abc')).toBe('Unesite broj')
  })

  it('should refuse an empty field', () => {
    expect(message(Decimal.vForm, null)).toBe('Podatak je obavezan')
  })
})

describe('round trip', () => {
  it('should decode what it encoded', () => {
    const text = format(1234567.891, 2)
    expect(text).toBe('1.234.567,89')
    expect(Number(normalize(text))).toBe(1234567.89)
  })
})

describe('widget', () => {
  const draw = <A, I, R>(schema: Schema.Schema<A, I, R>) => {
    const options: Form.Options<{ readonly x: NumberDomain.Form }> = { template: l => l.inputs.x }
    return renderToStaticMarkup(
      Form.render({ schema: Schema.Struct({ x: schema }), value: { x: '42' }, onChange: () => {}, options }) as never,
    )
  }

  it('should be a plain text input, never a stepper', () => {
    for (const html of [draw(Int.vForm), draw(Decimal.vForm)]) {
      expect(html).toContain('type="text"')
      expect(html).not.toContain('step')
      expect(html).not.toContain('type="number"')
    }
  })

  it('should show what was typed, not the parsed number', () => {
    expect(draw(Decimal.vForm)).toContain('value="42"')
  })
})

// Konvencija zadaje granicu BROJEM CIFARA (Int = Number(10), Decimal2 = Number(18,2)),
// pa se meri na tekstu — `Number()` preko 2^53 vec izgubi tacnu vrednost.
describe('granica broja cifara', () => {
  it('prima Int na tacnoj granici od 10 cifara', () => {
    expect(decoded(Int.vForm, '1234567890')).toBe(1234567890)
  })

  it('odbija Int sa 11 cifara', () => {
    expect(message(Int.vForm, '12345678901')).toBe('Unesena vrednost ne sme imati vise od 10 cifara')
  })

  it('ne broji znak minus kao cifru', () => {
    expect(decoded(Int.vForm, '-1234567890')).toBe(-1234567890)
  })

  it('ne broji hiljadne tacke kao cifre', () => {
    expect(decoded(Int.vForm, '1.234.567.890')).toBe(1234567890)
    expect(message(Int.vForm, '12.345.678.901')).toBe('Unesena vrednost ne sme imati vise od 10 cifara')
  })

  it('prima Decimal2 na tacnoj granici od 16 cifara ispred zareza', () => {
    expect(check(Decimal.vForm, '1234567890123456,99').isValid).toBe(true)
  })

  it('odbija Decimal2 sa 17 cifara ispred zareza', () => {
    expect(message(Decimal.vForm, '12345678901234567,99')).toBe(
      'Unesena vrednost ne sme imati vise od 16 cifara ispred zareza',
    )
  })

  it('ne broji decimale u granicu', () => {
    expect(check(Decimal.vForm, '1234567890123456,49').isValid).toBe(true)
  })

  it('poruka o obliku ima prednost nad porukom o duzini', () => {
    expect(message(Int.vForm, 'aaaaaaaaaaaa')).toBe('Unesite ceo broj')
  })
})
