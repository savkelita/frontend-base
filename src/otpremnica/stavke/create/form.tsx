import { Form } from '../../../common/forms'
import type { FormModel, FormMsg, FormCtx, FieldRenderer, Draft, Payload } from '../../../common/forms'
import { ArtikalCombo } from '../../../sifarnici/api'
import * as Api from '../../api'

// -------------------------------------------------------------------------------------
// Stavka otpremnice — deklaracija forme
// -------------------------------------------------------------------------------------
//
// Ovde stoji sve što forma može sama da drži tačnim; feature (./index) nosi samo ono što
// forma ne može: učitavanje, snimanje i preduslov koji se pita pre snimanja.
//
//   artikal -> artikalPakovanje    kaskada: `dependsOn` resetuje dete, onemogućava ga dok
//                                  roditelj nije izabran, i hrani njegovu pretragu
//   osnovnaKolicina                izvedena vrednost: `derive` izriče pravilo jednom, a
//                                  forma ga obnavlja posle svake promene

export const fields = {
  redniBroj: Form.int({ label: 'Redni broj', min: 1 }),
  stavkaPorudzbenice: Form.combo({
    label: 'Stavka porudžbenice',
    optional: true,
    source: Api.StavkaPorudzbeniceOtpremnicaCombo,
  }),
  artikal: Form.combo({ label: 'Artikal', source: ArtikalCombo }),
  artikalPakovanje: Form.combo({
    label: 'Artikal pakovanje',
    source: Api.ArtikalPakovanjeOtpremnicaCombo,
    dependsOn: 'artikal',
    criteria: deps => ({ artikalID: deps.artikal }),
  }),
  kolicina: Form.decimal({ label: 'Poručena količina', min: 0 }),
  osnovnaKolicina: Form.decimal({ label: 'Osnovna količina', min: 0 }),
}

export type FieldKey = keyof typeof fields
export type StavkaFormModel = FormModel<typeof fields>
export type StavkaFormMsg = FormMsg<typeof fields>
type StavkaDraft = Draft<typeof fields>
type Ctx = FormCtx<typeof fields>

// -------------------------------------------------------------------------------------
// Osnovna količina = količina × kolicinaUOsnovnojJM × kolicinaUPakovanju
// -------------------------------------------------------------------------------------
//
// Jedno pravilo na jednom mestu. Napisano kao invarijanta, a ne kao reakcija, pa ne može da
// se razidje onako kako se razilaze dva odvojena handlera promene.

const osnovnaKolicina = (draft: StavkaDraft, ctx: Ctx): string => {
  const pakovanje = ctx.chosen('artikalPakovanje')
  const kolicina = Number(draft.kolicina.trim().replace(',', '.'))
  if (!pakovanje || draft.kolicina.trim() === '' || !Number.isFinite(kolicina)) return ''
  return String(kolicina * pakovanje.kolicinaUOsnovnojJM * pakovanje.kolicinaUPakovanju)
}

export const StavkaForm = Form.object(fields, {
  derive: (draft, ctx) => ({ osnovnaKolicina: osnovnaKolicina(draft, ctx) }),

  rules: draft => {
    // Stavka preuzeta sa porudžbenice diktira svoj artikal i pakovanje: prikazani, ali ne i
    // izmenjivi. Disabled a ne readonly, jer se ta dva i dalje moraju validirati — readonly
    // polja se preskaču, pa bi prazan obavezan combo prošao neprimećeno.
    const fromOrder = draft.stavkaPorudzbenice !== ''
    return {
      osnovnaKolicina: { readonly: true },
      artikal: { enabled: !fromOrder },
      artikalPakovanje: { enabled: !fromOrder },
    }
  },
})

// -------------------------------------------------------------------------------------
// Šta feature upisuje nazad u formu
// -------------------------------------------------------------------------------------

/** Stavka porudžbenice koju je korisnik izabrao, ili undefined — njeni id-evi vode pretragu u ./index. */
export const chosenOrderLine = (model: StavkaFormModel): Api.StavkaPorudzbeniceOtpremnicaComboResult | undefined =>
  StavkaForm.selected(model, 'stavkaPorudzbenice')[0]?.data

/** Promenjena stavka porudžbenice odlučuje o artiklu i pakovanju, pa ono što je bilo tu prvo ide. */
export const clearOrderDrivenFields = (model: StavkaFormModel): StavkaFormModel =>
  StavkaForm.setValues(model, { artikal: '', artikalPakovanje: '', kolicina: '' })

/** Popuni artikal + pakovanje iz pronađenog reda pakovanja, zadržavajući obe labele. */
export const fillFromPakovanje = (
  model: StavkaFormModel,
  row: Api.ArtikalPakovanjeOtpremnicaComboResult,
): StavkaFormModel => {
  const withArtikal = StavkaForm.update(
    {
      _tag: 'SetOption',
      key: 'artikal',
      options: [{ value: String(row.artikalID), label: `${row.artikalSifra} - ${row.artikalNaziv}` }],
    },
    model,
  )[0]
  return StavkaForm.update(
    {
      _tag: 'SetOption',
      key: 'artikalPakovanje',
      options: [{ value: String(row.id), label: row.pakovanjeDimenzijaNaziv, data: row }],
    },
    withArtikal,
  )[0]
}

// -------------------------------------------------------------------------------------
// Payload -> komanda. Ovaj šav pripada feature-u: id-evi kojih nema na formi (otpremnicaID)
// i odgovor na preduslov ubacuju se ovde.
// -------------------------------------------------------------------------------------

export const toCmd = (
  payload: Payload<typeof fields>,
  extra: { readonly otpremnicaID: number; readonly kreirajMagacinArtikalPakovanje: boolean },
): Api.KreirajStavkaOtpremniceCmd => ({
  otpremnicaID: extra.otpremnicaID,
  redniBroj: payload.redniBroj,
  artikalPakovanjeID: payload.artikalPakovanje,
  stavkaPorudzbeniceID: payload.stavkaPorudzbenice ?? null,
  kolicina: payload.kolicina,
  osnovnaKolicina: payload.osnovnaKolicina,
  kreirajMagacinArtikalPakovanje: extra.kreirajMagacinArtikalPakovanje,
})

// -------------------------------------------------------------------------------------
// Raspored — combo stavke porudžbenice postoji samo kada otpremnica potiče od porudžbenice
// -------------------------------------------------------------------------------------

const grid = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' } as const
const full = { gridColumn: '1 / -1' } as const

export const layout = (hasPorudzbenica: boolean) => (field: FieldRenderer<typeof fields>) => (
  <div style={grid}>
    <div>{field('redniBroj')}</div>
    {hasPorudzbenica && <div>{field('stavkaPorudzbenice')}</div>}
    <div style={full}>{field('artikal')}</div>
    <div style={full}>{field('artikalPakovanje')}</div>
    <div>{field('kolicina')}</div>
    <div>{field('osnovnaKolicina')}</div>
  </div>
)
