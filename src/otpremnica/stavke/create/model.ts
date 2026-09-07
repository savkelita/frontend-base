import type { Option } from 'effect'
import type * as Http from 'tea-effect/Http'
import type { Payload } from '../../../common/forms'
import type { fields, StavkaFormModel } from './form'

// -------------------------------------------------------------------------------------
// Kreiranje stavke otpremnice — prvo učita predloženi redni broj, pa se onda unosi
// -------------------------------------------------------------------------------------

/** Snimanje ne kreće pravo iz forme: čeka iza preduslova. */
export type Saving =
  /** Ništa nije u letu; korisnik unosi. */
  | { readonly _tag: 'Idle' }
  /** Pita se server da li magacin poznaje ovo pakovanje. */
  | { readonly _tag: 'Provera' }
  /** Ne poznaje ga: korisnik se pita da li da se kreira zajedno sa stavkom. */
  | { readonly _tag: 'Confirming' }
  /** Stavka se upisuje. */
  | { readonly _tag: 'Saving' }

export type LoadedModel = {
  readonly form: StavkaFormModel
  /** Validiran payload, čuva se između preduslova i snimanja. */
  readonly pending: Option.Option<Payload<typeof fields>>
  readonly saving: Saving
  /** Traži se artikal + pakovanje iza izabrane stavke porudžbenice. */
  readonly dovlacenjeArtiklaUProgress: boolean
  readonly error: Option.Option<Http.HttpError>
}

export type Model =
  | { readonly _tag: 'Loading' }
  | { readonly _tag: 'Ready'; readonly loaded: LoadedModel }
  | { readonly _tag: 'Failed'; readonly error: Http.HttpError }

/** Da li je nešto u letu ili čeka odgovor? Dok jeste, snimanje i zatvaranje su blokirani. */
export const isBusy = (loaded: LoadedModel): boolean =>
  loaded.saving._tag !== 'Idle' || loaded.dovlacenjeArtiklaUProgress
