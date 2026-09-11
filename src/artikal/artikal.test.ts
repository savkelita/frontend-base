import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Kreiranje from './kreiranje'
import * as Brisanje from './brisanje'
import * as Azuriranje from './azuriranje'
import { ArtikalForm as AzuriranjeForm, initialForm } from './azuriranje/form'
import { ArtikalForm as KreiranjeForm } from './kreiranje/form'
import { authorization } from './index'

// -------------------------------------------------------------------------------------
// Пилот модул
// -------------------------------------------------------------------------------------
//
// Циљ пилота није функционалност него доказ да екран не зна ко га услужује. Први тест то
// и тврди дословно: разлика између две руте сме да буде само профил и базна путања.

describe('routes.java и routes.dotnet', () => {
  const bezKomentara = (putanja: string): ReadonlyArray<string> =>
    readFileSync(putanja, 'utf8')
      .split('\n')
      .map(red => red.trimEnd())
      .filter(red => !red.trimStart().startsWith('//'))

  it('разликују се само у имену профила и базној путањи', () => {
    const java = bezKomentara('src/artikal/api/routes.java.ts')
    const dotnet = bezKomentara('src/artikal/api/routes.dotnet.ts')

    expect(java.length).toBe(dotnet.length)
    const razlike = java.map((red, i) => [red, dotnet[i]] as const).filter(([a, b]) => a !== b)

    expect(razlike).toEqual([
      ["const api = makeApi(profiles.java, '/api/sifarnik')", "const api = makeApi(profiles.dotnet, '/net/Sifarnik')"],
    ])
  })
})

describe('права модула', () => {
  it('листа права постаје облик који радње очекују', () => {
    const auth = authorization({ permissions: ['artikal.view', 'artikal.kreiranje'] })
    expect(Kreiranje.isAuthorized(auth)).toBe(true)
    expect(Azuriranje.isAuthorized(auth)).toBe(false)
    expect(Brisanje.isAuthorized(auth)).toBe(false)
  })

  it('без права нема ни дугмета — предуслов не пита за стање', () => {
    const auth = authorization({ permissions: [] })
    expect(Kreiranje.preduslov(auth)).toBe(false)
    expect(Brisanje.preduslov(auth, 'U_PRIPREMI')).toBe(false)
  })
})

describe('предуслови радњи', () => {
  const svaPrava = authorization({
    permissions: ['artikal.view', 'artikal.kreiranje', 'artikal.azuriranje', 'artikal.brisanje'],
  })

  it('брише се само артикал у припреми', () => {
    expect(Brisanje.preduslov(svaPrava, 'U_PRIPREMI')).toBe(true)
    expect(Brisanje.preduslov(svaPrava, 'AKTIVAN')).toBe(false)
    expect(Brisanje.preduslov(svaPrava, 'NEAKTIVAN')).toBe(false)
  })

  it('мења се све осим неактивног', () => {
    expect(Azuriranje.preduslov(svaPrava, 'U_PRIPREMI')).toBe(true)
    expect(Azuriranje.preduslov(svaPrava, 'AKTIVAN')).toBe(true)
    expect(Azuriranje.preduslov(svaPrava, 'NEAKTIVAN')).toBe(false)
  })

  it('док се запис не учита, стање није познато и радња се не нуди', () => {
    expect(Brisanje.preduslov(svaPrava, null)).toBe(false)
  })
})

describe('форме артикла', () => {
  const zapis = {
    id: 1,
    version: 0,
    sifra: 'ART-1',
    naziv: 'Млеко',
    skraceniNaziv: 'Млеко',
    jedinicaMereID: 10,
    jedinicaMereOznaka: 'kom',
    grupaArtiklaID: 20,
    grupaArtiklaNaziv: 'Млечни производи',
    kolicinaUJediniciMere: 1,
    stanje: 'AKTIVAN' as const,
  }

  it('шифра се уноси при креирању, а при измени је уопште нема на форми', () => {
    const [uNosu] = KreiranjeForm.create()
    expect(KreiranjeForm.fieldUi(uNosu, 'sifra').readonly).toBe(false)

    const [uIzmeni] = AzuriranjeForm.edit(initialForm(zapis))
    expect(Object.keys(AzuriranjeForm.draft(uIzmeni))).not.toContain('sifra')
  })

  it('combo носи лабелу из записа, не голу шифру', () => {
    const [model] = AzuriranjeForm.edit(initialForm(zapis))
    expect(AzuriranjeForm.draft(model).jedinicaMere?.label).toBe('kom')
    expect(AzuriranjeForm.draft(model).grupaArtikla?.label).toBe('Млечни производи')
  })

  it('идентификатор из комбоа стиже у тело захтева као број', () => {
    const [model] = AzuriranjeForm.edit(initialForm(zapis))
    const [, payload] = AzuriranjeForm.trySubmit(model)
    expect(Option.isSome(payload) && payload.value.jedinicaMere).toBe(10)
  })

  it('празна форма се не шаље серверу', () => {
    const [prazna] = KreiranjeForm.create()
    const [, payload] = KreiranjeForm.trySubmit(prazna)
    expect(Option.isNone(payload)).toBe(true)
  })
})

describe('креирање', () => {
  it('одустанак враћа исход домаћину, без иједног захтева', () => {
    const [model] = Kreiranje.init()
    const [, cmd, outcome] = Kreiranje.update(Kreiranje.Msg.Cancel(), model)
    expect(outcome._tag).toBe('Cancel')
    expect(cmd).toBe(Cmd.none)
  })

  it('неисправан унос не покреће снимање', () => {
    const [model] = Kreiranje.init()
    const [sledeci, cmd, outcome] = Kreiranje.update(Kreiranje.Msg.Save(), model)
    expect(outcome._tag).toBe('Active')
    expect(cmd).toBe(Cmd.none)
    expect(sledeci.saving).toBe(false)
  })
})

describe('брисање', () => {
  const identifikator = { id: 1000, version: 0 }

  it('потврда покреће захтев и закључава дијалог', () => {
    const [model, cmd, outcome] = Brisanje.update(identifikator, Brisanje.Msg.Delete(), Brisanje.init)
    expect(model.deleting).toBe(true)
    expect(outcome._tag).toBe('Active')
    expect(cmd).not.toBe(Cmd.none)
  })

  it('успех иде домаћину — брисање не зна куда се даље иде', () => {
    const [, , outcome] = Brisanje.update(identifikator, Brisanje.Msg.Deleted(), {
      ...Brisanje.init,
      deleting: true,
    })
    expect(outcome._tag).toBe('Success')
  })
})
