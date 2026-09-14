import { Schema } from 'effect'
import * as Boolean_ from '../domain/boolean'
import * as Code30 from '../domain/code30'
import * as ComboDomain from '../domain/combo'
import * as DateDomain from '../domain/date'
import * as DateRange from '../domain/date-range'
import * as Decimal from '../domain/decimal'
import * as EnumDomain from '../domain/enum'
import * as Name from '../domain/name'
import * as NumberDomain from '../domain/number'
import * as Text from '../domain/text'

// -------------------------------------------------------------------------------------
// Декларација поља
// -------------------------------------------------------------------------------------
//
// Једно поље = један домен + оно што екран о њему има да каже. Одавде се изводи све остало:
// почетна вредност, шема за проверу, и опције које стижу до виџета. Зато се поље пише
// једном, а не по трипут (тип форме, шема, ознаке).

export type Polje<V, A> = {
  /** Домен поља; на њему већ стоји и виџет и порука о грешци. */
  readonly vForm: Schema.Schema<A, any, never>
  /** Вредност од које форма креће, и мера за „да ли је дирано". */
  readonly initial: V
  /** Стиже до виџета онаква каква јесте; `effect-form` је прослеђује неизмењену. */
  readonly options: Readonly<Record<string, unknown>>
  /** Само combo поља: одакле се пуни падајућа листа. */
  readonly source?: ComboDomain.Source<any>
}

/**
 * Ознака је обавезна, остало зависи од виџета.
 *
 * `initialValue` се наводи само кад форма не креће од празног поља — иначе важи оно што је
 * за тај домен празно (`null`, празан опсег, празан избор).
 */
type Cfg<O, V> = { readonly label: string; readonly initialValue?: V } & O

const leaf = <V, A>(
  vForm: Schema.Schema<A, any, never>,
  prazno: V,
  initialValue: V | undefined,
  options: Readonly<Record<string, unknown>>,
): Polje<V, A> => ({ vForm, initial: initialValue === undefined ? prazno : initialValue, options })

// -------------------------------------------------------------------------------------
// Текст
// -------------------------------------------------------------------------------------

type TextOpt = {
  readonly placeholder?: string
  readonly autoFocus?: boolean
  readonly type?: 'text' | 'password' | 'email'
  readonly autoComplete?: string
}

export const text = ({
  label,
  maxLength,
  initialValue,
  ...opt
}: Cfg<TextOpt & { readonly maxLength: number }, Text.Form>) =>
  leaf<Text.Form, string>(Text.vForm(maxLength), null, initialValue, { label, ...opt })

export const code30 = ({ label, initialValue, ...opt }: Cfg<TextOpt, Code30.Form>) =>
  leaf<Code30.Form, string>(Code30.vForm, null, initialValue, { label, ...opt })

export const name = ({ label, initialValue, ...opt }: Cfg<TextOpt, Name.Form>) =>
  leaf<Name.Form, string>(Name.vForm, null, initialValue, { label, ...opt })

// -------------------------------------------------------------------------------------
// Бројеви
// -------------------------------------------------------------------------------------

type NumberOpt = {
  readonly placeholder?: string
  readonly autoFocus?: boolean
  readonly min?: number
  readonly max?: number
}

/** Цео број; `maxIntegerDigits` је колико цифара стаје, подразумевано девет. */
export const number = ({
  label,
  maxIntegerDigits = 9,
  min,
  max,
  initialValue,
  ...opt
}: Cfg<NumberOpt & { readonly maxIntegerDigits?: number }, NumberDomain.Form>) =>
  leaf<NumberDomain.Form, number>(NumberDomain.vForm(0, maxIntegerDigits, { min, max }), null, initialValue, {
    label,
    ...opt,
  })

export const decimal = ({ label, min, max, initialValue, ...opt }: Cfg<NumberOpt, Decimal.Form>) =>
  leaf<Decimal.Form, number>(Decimal.vFormOf({ min, max }), null, initialValue, { label, ...opt })

// -------------------------------------------------------------------------------------
// Остали прости домени
// -------------------------------------------------------------------------------------

export const flag = ({
  label,
  initialValue,
  ...opt
}: Cfg<{ readonly da?: string; readonly ne?: string }, Boolean_.Form>) =>
  leaf<Boolean_.Form, boolean>(Boolean_.vForm, null, initialValue, { label, ...opt })

type DateOpt = {
  readonly placeholder?: string
  readonly minDate?: Date
  readonly maxDate?: Date
  readonly allowTextInput?: boolean
}

export const date = ({ label, initialValue, ...opt }: Cfg<DateOpt, DateDomain.Form>) =>
  leaf<DateDomain.Form, Date>(DateDomain.vForm, null, initialValue, { label, ...opt })

export const dateRange = ({ label, initialValue, ...opt }: Cfg<Omit<DateOpt, 'placeholder'>, DateRange.Form>) =>
  leaf<DateRange.Form, readonly [Date | null, Date | null]>(DateRange.vForm, [null, null], initialValue, {
    label,
    ...opt,
  })

type EnumOpt = { readonly placeholder?: string; readonly clearable?: boolean }

export const enumField = <K extends EnumDomain.Keys>({
  label,
  keys,
  only,
  initialValue,
  ...opt
}: Cfg<
  EnumOpt & { readonly keys: K; readonly only?: ReadonlyArray<keyof K & string> },
  EnumDomain.Form<keyof K & string>
>) =>
  leaf<EnumDomain.Form<keyof K & string>, keyof K & string>(EnumDomain.vForm(keys, only), null, initialValue, {
    label,
    ...opt,
  })

export const multiEnum = <K extends EnumDomain.Keys>({
  label,
  keys,
  initialValue,
  ...opt
}: Cfg<EnumOpt & { readonly keys: K }, ReadonlyArray<keyof K & string>>) =>
  leaf<ReadonlyArray<keyof K & string>, ReadonlyArray<keyof K & string>>(
    EnumDomain.vFormMulti(keys),
    [],
    initialValue,
    { label, ...opt },
  )

// -------------------------------------------------------------------------------------
// Combo
// -------------------------------------------------------------------------------------
//
// Једина разлика у односу на остала поља: уз домен иде и извор. Одатле форма зна да сама
// држи стање претраге, па екран за combo не пише ни модел, ни поруку, ни грану у `update`-у.

type ComboBase<A> = {
  readonly label: string
  readonly placeholder?: string
  /** Тип реда који рута враћа. */
  readonly io: Schema.Schema<A, any, never>
  readonly source: ComboDomain.Source<A>
  readonly render: ComboDomain.Render<A>
}

export type ComboCfg<A> = ComboBase<A> & { readonly initialValue?: ComboDomain.Form<A> }

export type MultiComboCfg<A> = ComboBase<A> & { readonly initialValue?: ComboDomain.FormMulti<A> }

export const combo = <A>({
  label,
  io,
  source,
  render,
  initialValue = null,
  ...opt
}: ComboCfg<A>): Polje<ComboDomain.Form<A>, A> => ({
  vForm: ComboDomain.vForm(io as Schema.Schema<A, A, never>, render),
  initial: initialValue,
  options: { label, ...opt },
  source,
})

export const multiCombo = <A>({
  label,
  io,
  source,
  render,
  initialValue = [],
  ...opt
}: MultiComboCfg<A>): Polje<ComboDomain.FormMulti<A>, ReadonlyArray<A>> => ({
  vForm: ComboDomain.vFormMulti(io as Schema.Schema<A, A, never>, render),
  initial: initialValue,
  options: { label, ...opt },
  source,
})

// -------------------------------------------------------------------------------------
// Необавезно поље
// -------------------------------------------------------------------------------------

/** Исто поље, али сме да остане празно — `required` у виџету пада само од овога. */
export const optional = <V, A>(polje: Polje<V, A>): Polje<V, A | null> => ({
  ...polje,
  vForm: Schema.NullOr(polje.vForm),
})
