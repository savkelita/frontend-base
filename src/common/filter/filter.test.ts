import { describe, it, expect } from 'vitest'
import { profiles } from '../platform'
import { OPERATORI_BROJ, OPERATORI_TEKST } from './operatori'
import * as Polje from './polja'
import { izKriterijuma, napraviFilter, uKriterijume } from './index'

// -------------------------------------------------------------------------------------
// Филтер: критеријуми у оба смера
// -------------------------------------------------------------------------------------
//
// Испитује се шта завршава у критеријумима, јер се управо то преноси у query. Празно поље
// које не испадне значи претрагу по празном стрингу — грешка коју ниједан тип не хвата.

const polja = {
  serijskiBroj: Polje.tekstPredikat({
    label: 'Серијски број',
    operatori: OPERATORI_TEKST,
    podrazumevani: 'contains',
  }),
  kolicina: Polje.brojPredikat({ label: 'Количина', operatori: OPERATORI_BROJ, podrazumevani: 'eq' }),
  napomena: Polje.tekst({ label: 'Напомена' }),
}

const filter = napraviFilter(profiles.java, polja, () => null as never)

const saVrednostima = (vrednosti: Partial<{ [K in keyof typeof polja]: unknown }>) => {
  const [model] = filter.forma.create()
  return filter.forma.setValues(model, vrednosti as never)
}

describe('uKriterijume', () => {
  it('празна форма не даје ниједан критеријум', () => {
    const [model] = filter.forma.create()
    expect(uKriterijume(filter, model)).toEqual({})
  })

  it('попуњено предикатско поље даје н-торку оператор + вредност', () => {
    const model = saVrednostima({ serijskiBroj: ['starts_with', 'AB'] })
    expect(uKriterijume(filter, model)).toEqual({ serijskiBroj: ['starts_with', 'AB'] })
  })

  it('предикат са празном вредношћу испада, ма који оператор био', () => {
    const model = saVrednostima({ serijskiBroj: ['eq', '   '] })
    expect(uKriterijume(filter, model)).toEqual({})
  })

  it('обично поље иде голо, без оператора', () => {
    const model = saVrednostima({ napomena: 'хитно' })
    expect(uKriterijume(filter, model)).toEqual({ napomena: 'хитно' })
  })

  it('between иде као једна вредност спојена тилдом', () => {
    const model = saVrednostima({ kolicina: ['between', '5~10'] })
    expect(uKriterijume(filter, model)).toEqual({ kolicina: ['between', '5~10'] })
  })

  it('полупразан between испада — сервер не уме са једном границом', () => {
    const model = saVrednostima({ kolicina: ['between', '5~'] })
    expect(uKriterijume(filter, model)).toEqual({})
  })
})

describe('izKriterijuma', () => {
  it('враћа у форму оно што је прочитано из адресне линије', () => {
    const criteria = { serijskiBroj: ['contains', 'XY'], napomena: 'хитно' }
    const [model] = izKriterijuma(filter, criteria)
    expect(uKriterijume(filter, model)).toEqual(criteria)
  })

  it('гола вредност на предикатском пољу добија подразумевани оператор', () => {
    const [model] = izKriterijuma(filter, { serijskiBroj: 'XY' })
    expect(uKriterijume(filter, model)).toEqual({ serijskiBroj: ['contains', 'XY'] })
  })

  it('критеријум за који не постоји поље се прескаче', () => {
    const [model] = izKriterijuma(filter, { otpremnicaID: 7 })
    expect(uKriterijume(filter, model)).toEqual({})
  })
})

describe('napraviFilter', () => {
  it('одбија предикатска поља на .NET профилу', () => {
    expect(() => napraviFilter(profiles.dotnet, polja, () => null as never)).toThrow(/serijskiBroj/)
  })

  it('обична поља пролазе на оба профила', () => {
    const samoObicna = { napomena: Polje.tekst({ label: 'Напомена' }) }
    expect(() => napraviFilter(profiles.dotnet, samoObicna, () => null as never)).not.toThrow()
  })
})
