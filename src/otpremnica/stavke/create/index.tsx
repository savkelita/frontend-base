import { Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import { Form } from '../../../common/forms'
import type { FormDialogState } from '../../../common/forms'
import { proveriMagacinArtikalPakovanje } from '../../../prijem/api'
import * as Api from '../../api'
import type { Model, LoadedModel } from './model'
import { isBusy } from './model'
import {
  Msg,
  Outcome,
  loaded,
  loadFailed,
  formMsg,
  prefilled,
  provera,
  checked,
  potvrdiKreiranjeMagacinArtikalPakovanje,
  dismissConfirm,
  saved,
  failed,
  close,
} from './msg'
import { StavkaForm, layout, fields, toCmd, chosenOrderLine, clearOrderDrivenFields, fillFromPakovanje } from './form'

export type { Model }
export type { Msg }
export { Outcome }

// -------------------------------------------------------------------------------------
// Kreiranje stavke otpremnice
// -------------------------------------------------------------------------------------
//
// Ono što forma radi sama (kaskada, izvedena količina, onemogućavanje) deklarisano je u
// ./form. Ovde ostaje deo koji forma ne može da nosi:
//
//   1. predloženi redni broj, učitan pre nego što forma uopšte postoji
//   2. popunjavanje artikla + pakovanja sa izabrane stavke porudžbenice (jedna pretraga i
//      zastavica napretka)
//   3. snimanje, koje nije trenutno: magacin možda ne poznaje ovo pakovanje, pa se prvo pita
//      server, a korisnik možda mora da odgovori pre nego što se išta upiše

export type Context = {
  readonly otpremnicaID: number
  readonly magacinID: number
  /** Null kada otpremnica nije vezana za porudžbenicu; tada nema comboa stavke porudžbenice. */
  readonly porudzbenicaID: number | null
}

export const init = (ctx: Context): [Model, Cmd.Cmd<Msg>] => [
  { _tag: 'Loading' },
  Http.send(Api.dajSledeciRedniBrojStavkeOtpremnice(ctx.otpremnicaID), { onSuccess: loaded, onError: loadFailed }),
]

const ready = (loadedModel: LoadedModel): Model => ({ _tag: 'Ready', loaded: loadedModel })

const active = (model: Model, cmd: Cmd.Cmd<Msg> = Cmd.none): [Model, Cmd.Cmd<Msg>, Outcome] => [
  model,
  cmd,
  Outcome.Active(),
]

/** Pronađi artikal + pakovanje na koje stavka porudžbenice pokazuje, da se oba comboa popune sa labelama. */
const prefillCmd = (line: Api.StavkaPorudzbeniceOtpremnicaComboResult): Cmd.Cmd<Msg> =>
  Http.send(
    Api.pretraziArtikalPakovanjeOtpremnicaCombo(
      { id: line.artikalPakovanjeID, artikalID: String(line.artikalID) },
      0,
      1,
    ),
    { onSuccess: prefilled, onError: failed },
  )

const proveraCmd = (ctx: Context, artikalPakovanjeID: number): Cmd.Cmd<Msg> =>
  Http.send(proveriMagacinArtikalPakovanje(ctx.magacinID, artikalPakovanjeID), {
    onSuccess: checked,
    onError: failed,
  })

const saveCmd = (ctx: Context, loadedModel: LoadedModel, kreirajMagacinArtikalPakovanje: boolean): Cmd.Cmd<Msg> =>
  Option.match(loadedModel.pending, {
    onNone: () => Cmd.none,
    onSome: payload =>
      Http.send(
        Api.kreirajStavkaOtpremnice(toCmd(payload, { otpremnicaID: ctx.otpremnicaID, kreirajMagacinArtikalPakovanje })),
        { onSuccess: saved, onError: failed },
      ),
  })

export const update = (ctx: Context, msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>, Outcome] =>
  Msg.$match(msg, {
    Loaded: ({ predlozeniRedniBroj }): [Model, Cmd.Cmd<Msg>, Outcome] => {
      const [form, cmd] = StavkaForm.create()
      return active(
        ready({
          // Predloženi broj stiže pre same forme, pa se upisuje direktno.
          form: StavkaForm.setValues(form, { redniBroj: String(predlozeniRedniBroj) }),
          pending: Option.none(),
          saving: { _tag: 'Idle' },
          dovlacenjeArtiklaUProgress: false,
          error: Option.none(),
        }),
        Cmd.map(formMsg)(cmd),
      )
    },

    LoadFailed: ({ error }): [Model, Cmd.Cmd<Msg>, Outcome] => active({ _tag: 'Failed', error }),

    // Polje obrađuje sama forma. Feature-u ostaje jedino stavka porudžbenice: ona odlučuje o
    // artiklu i pakovanju, pa ih promena briše i traži red kojim treba da se popune. Promena
    // se primećuje poređenjem izbora pre i posle — bez zalaženja u combo iznutra.
    Form: ({ msg: formMessage }): [Model, Cmd.Cmd<Msg>, Outcome] => {
      if (model._tag !== 'Ready') return active(model)
      const before = chosenOrderLine(model.loaded.form)
      const [updated, cmd] = StavkaForm.update(formMessage, model.loaded.form)
      const after = chosenOrderLine(updated)
      const formCmd = Cmd.map(formMsg)(cmd)

      if (before?.id === after?.id) return active(ready({ ...model.loaded, form: updated }), formCmd)

      const form = clearOrderDrivenFields(updated)
      return after === undefined
        ? active(ready({ ...model.loaded, form }), formCmd)
        : active(
            ready({ ...model.loaded, form, dovlacenjeArtiklaUProgress: true, error: Option.none() }),
            Cmd.batch([formCmd, prefillCmd(after)]),
          )
    },

    Prefilled: ({ response }): [Model, Cmd.Cmd<Msg>, Outcome] => {
      if (model._tag !== 'Ready') return active(model)
      const row = response.result[0]
      return active(
        ready({
          ...model.loaded,
          form: row === undefined ? model.loaded.form : fillFromPakovanje(model.loaded.form, row),
          dovlacenjeArtiklaUProgress: false,
        }),
      )
    },

    // Snimanje ne upisuje: prvo validira, pa pita server da li magacin poznaje ovo pakovanje.
    Provera: (): [Model, Cmd.Cmd<Msg>, Outcome] => {
      if (model._tag !== 'Ready' || isBusy(model.loaded)) return active(model)
      const [form, payload] = StavkaForm.trySubmit(model.loaded.form)
      return Option.match(payload, {
        onNone: (): [Model, Cmd.Cmd<Msg>, Outcome] => active(ready({ ...model.loaded, form })),
        onSome: (validated): [Model, Cmd.Cmd<Msg>, Outcome] =>
          active(
            ready({
              ...model.loaded,
              form,
              pending: Option.some(validated),
              saving: { _tag: 'Provera' },
              error: Option.none(),
            }),
            proveraCmd(ctx, validated.artikalPakovanje),
          ),
      })
    },

    Checked: ({ info }): [Model, Cmd.Cmd<Msg>, Outcome] => {
      if (model._tag !== 'Ready') return active(model)
      // Poznato pakovanje: snimi odmah. Nepoznato: korisnik prvo mora da odgovori.
      return info.postoji
        ? active(ready({ ...model.loaded, saving: { _tag: 'Saving' } }), saveCmd(ctx, model.loaded, false))
        : active(ready({ ...model.loaded, saving: { _tag: 'Confirming' } }))
    },

    PotvrdiKreiranjeMagacinArtikalPakovanje: ({ kreiraj }): [Model, Cmd.Cmd<Msg>, Outcome] => {
      if (model._tag !== 'Ready') return active(model)
      return active(ready({ ...model.loaded, saving: { _tag: 'Saving' } }), saveCmd(ctx, model.loaded, kreiraj))
    },

    // Odustajanje od pitanja napušta snimanje i vraća formu korisniku.
    DismissConfirm: (): [Model, Cmd.Cmd<Msg>, Outcome] => {
      if (model._tag !== 'Ready') return active(model)
      return active(
        ready({
          ...model.loaded,
          form: StavkaForm.toEditing(model.loaded.form),
          pending: Option.none(),
          saving: { _tag: 'Idle' },
        }),
      )
    },

    Saved: ({ identifikator }): [Model, Cmd.Cmd<Msg>, Outcome] => [model, Cmd.none, Outcome.Success({ identifikator })],

    // Jedan handler za svaki zahtev na putu snimanja: vrati formu uz prikazanu grešku.
    Failed: ({ error }): [Model, Cmd.Cmd<Msg>, Outcome] => {
      if (model._tag !== 'Ready') return active(model)
      return active(
        ready({
          ...model.loaded,
          form: StavkaForm.toEditing(model.loaded.form),
          pending: Option.none(),
          saving: { _tag: 'Idle' },
          dovlacenjeArtiklaUProgress: false,
          error: Option.some(error),
        }),
      )
    },

    Close: (): [Model, Cmd.Cmd<Msg>, Outcome] =>
      model._tag === 'Ready' && isBusy(model.loaded) ? active(model) : [model, Cmd.none, Outcome.Cancel()],
  })

// -------------------------------------------------------------------------------------
// Prikaz — dijalog forme, plus pitanje koje može da prekine snimanje
// -------------------------------------------------------------------------------------

const MAGACIN_PAKOVANJE_PORUKA =
  'Za magacin iz otpremnice nije definisano pakovanje za ovaj artikal. Da li želite da ga kreirate?'

export const view =
  (ctx: Context, model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => {
    const state: FormDialogState<typeof fields> =
      model._tag === 'Loading'
        ? { status: 'Loading' }
        : model._tag === 'Failed'
          ? { status: 'Failed', error: 'Neuspešno učitavanje rednog broja stavke.' }
          : { status: 'Ready', model: model.loaded.form }

    const busy = model._tag === 'Ready' && isBusy(model.loaded)
    const confirming = model._tag === 'Ready' && model.loaded.saving._tag === 'Confirming'
    const error =
      model._tag === 'Ready' && Option.isSome(model.loaded.error) ? 'Radnja nije uspela. Pokušajte ponovo.' : undefined

    return (
      <>
        {Form.dialog({
          spec: StavkaForm,
          state,
          layout: layout(ctx.porudzbenicaID !== null),
          title: 'Kreiranje stavke otpremnice',
          dispatch: m => dispatch(formMsg(m)),
          onSubmit: () => dispatch(provera()),
          onClose: () => dispatch(close()),
          error,
          saveDisabled: busy,
          width: 720,
        })}
        {confirming &&
          Form.confirmDialog({
            title: 'Pakovanje nije definisano',
            message: MAGACIN_PAKOVANJE_PORUKA,
            confirmLabel: 'Da',
            onConfirm: () => dispatch(potvrdiKreiranjeMagacinArtikalPakovanje(true)),
            onCancel: () => dispatch(dismissConfirm()),
          })}
      </>
    )
  }
