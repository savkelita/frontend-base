import { describe, it, expect } from 'vitest'
import * as Cmd from 'tea-effect/Cmd'
import { izOdgovora, preostaloSekundi } from '../session'
import type { Sesija } from '../session'
import { Msg } from './msg'
import { init, update, upozorava } from './index'

const SADA = 1_700_000_000_000

const sesija = (sekundi: number): Sesija => ({
  korisnickoIme: 'demo',
  prava: ['home.view'],
  istice: SADA + sekundi * 1000,
})

describe('сесија из одговора', () => {
  it('релативан истек постаје апсолутан тренутак', () => {
    const s = izOdgovora({ korisnickoIme: 'demo', authorizations: [{ name: 'a' }], istekZaSekundi: 600 }, SADA)
    expect(s.istice).toBe(SADA + 600_000)
    expect(s.prava).toEqual(['a'])
  })

  it('преостало никад није негативно', () => {
    expect(preostaloSekundi(sesija(-30), SADA)).toBe(0)
  })
})

describe('одбројавање', () => {
  it('дијалог се не показује док има времена', () => {
    expect(upozorava(init(sesija(600), SADA))).toBe(false)
  })

  it('дијалог се показује испод прага од два минута', () => {
    expect(upozorava(init(sesija(90), SADA))).toBe(true)
  })

  it('откуцај умањује преостало време', () => {
    const [model, , ishod] = update(Msg.Otkucaj({ sada: SADA + 10_000 }), init(sesija(600), SADA))
    expect(model.preostalo).toBe(590)
    expect(ishod._tag).toBe('Nastavi')
  })

  it('кад преостало падне на нулу, сесија је готова', () => {
    const [, , ishod] = update(Msg.Otkucaj({ sada: SADA + 601_000 }), init(sesija(600), SADA))
    expect(ishod._tag).toBe('Zavrsena')
  })
})

describe('продужавање', () => {
  it('шаље захтев и закључава дугме', () => {
    const [model, cmd, ishod] = update(Msg.Produzi(), init(sesija(60), SADA))
    expect(model.produzavanje).toBe(true)
    expect(cmd).not.toBe(Cmd.none)
    expect(ishod._tag).toBe('Nastavi')
  })

  it('други клик док траје први не шаље ништа', () => {
    const uToku = update(Msg.Produzi(), init(sesija(60), SADA))[0]
    const [, cmd] = update(Msg.Produzi(), uToku)
    expect(cmd).toBe(Cmd.none)
  })

  it('успех обнавља сесију и јавља домаћину', () => {
    const uToku = update(Msg.Produzi(), init(sesija(60), SADA))[0]
    const [model, , ishod] = update(
      Msg.Produzena({ odgovor: { korisnickoIme: 'demo', authorizations: [{ name: 'a' }], istekZaSekundi: 900 } }),
      uToku,
    )
    expect(model.produzavanje).toBe(false)
    expect(ishod._tag).toBe('Obnovljena')
  })

  // Ако продужавање не прође, сваки следећи захтев би ионако вратио 401.
  it('неуспех завршава сесију уместо да остави корисника унутра', () => {
    const uToku = update(Msg.Produzi(), init(sesija(60), SADA))[0]
    const [, , ishod] = update(Msg.ProduzavanjeNijeUspelo({ error: { _tag: 'Timeout' } }), uToku)
    expect(ishod._tag).toBe('Zavrsena')
  })
})

describe('друге картице', () => {
  it('одјава у другој картици завршава и ову', () => {
    const [, , ishod] = update(Msg.IzDrugeKartice({ sesija: null }), init(sesija(600), SADA))
    expect(ishod._tag).toBe('Zavrsena')
  })

  it('пријава у другој картици обнавља ову', () => {
    const nova = sesija(1200)
    const [model, , ishod] = update(Msg.IzDrugeKartice({ sesija: nova }), init(sesija(30), SADA))
    expect(ishod._tag).toBe('Obnovljena')
    expect(model.sesija).toEqual(nova)
  })
})
