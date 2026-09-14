import { Option, Schema } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import type * as Platform from 'tea-effect/Platform'
import type { Ctx } from 'effect-form/Form'
import type { ReactNode } from 'react'
import * as Combo from '../domain/combo'
import * as Osnova from '../form'
import type { Polje } from './polje'

// -------------------------------------------------------------------------------------
// Форма од декларисаних поља
// -------------------------------------------------------------------------------------
//
// `Form.object(fields)` из једне декларације изводи све што форми треба: почетну вредност,
// шему за проверу, опције виџета и — за combo поља — стање претраге. Зато екран нема ни
// модел, ни поруку, ни грану у `update`-у по комбоу, а ознаке се не преписују по други пут
// негде у приказу.

export type Fields = Readonly<Record<string, Polje<any, any>>>

/** Вредност форме док се попуњава — шира од оне коју команда прима. */
export type Draft<F extends Fields> = { readonly [K in keyof F]: F[K] extends Polje<infer V, any> ? V : never }

/** Вредност пошто прође проверу — оно што иде команди. */
export type Payload<F extends Fields> = { readonly [K in keyof F]: F[K] extends Polje<any, infer A> ? A : never }

export type FormModel<F extends Fields> = {
  readonly value: Draft<F>
  /** Стање претраге, по једно за сваки combo; кључ је име поља. */
  readonly combos: Readonly<Record<string, Combo.Model<unknown>>>
  /** Грешке се приказују тек пошто је корисник покушао да сними. */
  readonly showErrors: boolean
}

export type FormMsg<F extends Fields> =
  | { readonly _tag: 'Changed'; readonly value: Draft<F> }
  | { readonly _tag: 'Combo'; readonly key: keyof F & string; readonly msg: Combo.Msg<unknown> }

export const changed = <F extends Fields>(value: Draft<F>): FormMsg<F> => ({ _tag: 'Changed', value })

export const comboMsg = <F extends Fields>(key: keyof F & string, msg: Combo.Msg<unknown>): FormMsg<F> => ({
  _tag: 'Combo',
  key,
  msg,
})

export type FieldRenderer<F extends Fields> = (key: keyof F & string) => ReactNode

export type Layout<F extends Fields> = (field: FieldRenderer<F>) => ReactNode

/** Два реда су исти избор ако им је исти идентификатор; за остало важи обично поређење. */
const sameValue = (a: unknown, b: unknown): boolean => {
  if (a === b) return true
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => sameValue(x, b[i]))
  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null && 'id' in a && 'id' in b) {
    return (a as { readonly id: unknown }).id === (b as { readonly id: unknown }).id
  }
  return false
}

export const object = <F extends Fields>(fields: F) => {
  const keys = Object.keys(fields) as ReadonlyArray<keyof F & string>
  const comboKeys = keys.filter(key => fields[key].source !== undefined)

  /** Почетна вредност целе форме — склопљена из онога што свако поље каже да му је почетно. */
  const initial = Object.fromEntries(keys.map(key => [key, fields[key].initial])) as Draft<F>

  const struct = Schema.Struct(
    Object.fromEntries(keys.map(key => [key, fields[key].vForm])) as Schema.Struct.Fields,
  ) as unknown as Schema.Schema<Payload<F>, unknown, never>

  const vForm = (): Schema.Schema<Payload<F>, unknown, never> => struct

  const prazniCombos = (): Readonly<Record<string, Combo.Model<unknown>>> =>
    Object.fromEntries(comboKeys.map(key => [key, Combo.empty<unknown>()]))

  /** Форма са задатом вредношћу — креирање полази од почетне, измена од учитаног записа. */
  const initWith = (value: Draft<F>): FormModel<F> => ({ value, combos: prazniCombos(), showErrors: false })

  const init: FormModel<F> = initWith(initial)

  const update = (msg: FormMsg<F>, model: FormModel<F>): [FormModel<F>, Cmd.Cmd<FormMsg<F>>] => {
    if (msg._tag === 'Changed') return [{ ...model, value: msg.value }, Cmd.none]

    // Грана коју би екран иначе писао по једном за сваки combo — овде стоји написана једном.
    const [vrednost, combo, cmd] = Combo.step(
      fields[msg.key].source as Combo.Source<unknown>,
      msg.msg,
      model.combos[msg.key],
      model.value[msg.key] as unknown,
    )
    return [
      {
        ...model,
        value: { ...model.value, [msg.key]: vrednost },
        combos: { ...model.combos, [msg.key]: combo },
      },
      Cmd.map((m: Combo.Msg<unknown>) => comboMsg<F>(msg.key, m))(cmd),
    ]
  }

  /**
   * Провера и декодовање у једном кораку: `Some` само кад је форма исправна, а приказ
   * грешака се пали у оба случаја.
   */
  const submit = (model: FormModel<F>): [FormModel<F>, Option.Option<Payload<F>>] => {
    const result = Osnova.validate(vForm, model.value)
    return [{ ...model, showErrors: true }, result.isValid ? Option.some(result.value) : Option.none()]
  }

  /** Да ли је корисник нешто дирао — за упозорење при затварању. */
  const isDirty = (model: FormModel<F>, baseline: Draft<F> = initial): boolean =>
    keys.some(key => !sameValue(model.value[key], baseline[key]))

  const render =
    (model: FormModel<F>, layout: Layout<F>, ctx?: Partial<Ctx>) =>
    (dispatch: Platform.Dispatch<FormMsg<F>>): ReactNode => {
      // Опције поља стижу из његове декларације; комбоима се овде дода још и стање претраге.
      const opcije = Object.fromEntries(
        keys.map(key => [
          key,
          fields[key].source === undefined
            ? fields[key].options
            : {
                ...fields[key].options,
                model: model.combos[key],
                onMsg: (m: Combo.Msg<unknown>) => dispatch(comboMsg<F>(key, m)),
              },
        ]),
      )

      return Osnova.render({
        schema: vForm(),
        value: model.value,
        onChange: value => dispatch(changed<F>(value)),
        options: {
          template: locals => layout(key => (locals.inputs as Readonly<Record<string, ReactNode>>)[key]),
          fields: opcije,
        } as Osnova.Options<Draft<F>>,
        issues: Osnova.visibleIssues(vForm, model.value, model.showErrors),
        ctx,
      })
    }

  return { fields, initial, vForm, init, initWith, update, submit, isDirty, render }
}

export type FormSpec<F extends Fields> = ReturnType<typeof object<F>>
