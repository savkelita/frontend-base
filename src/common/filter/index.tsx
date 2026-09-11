import { Option } from 'effect'
import { Button, Drawer, DrawerBody, DrawerHeader, DrawerHeaderTitle } from '@fluentui/react-components'
import { DismissRegular } from '@fluentui/react-icons'
import type * as Cmd from 'tea-effect/Cmd'
import { Stack } from '../components/layout'
import { Form } from '../forms'
import type { Draft, Fields, FieldRenderer, FormModel, FormMsg, FormSpec } from '../forms'
import type { AnyCriteria, BackendProfile, Predicate } from '../platform'
import { S, t } from '../strings'
import type { PredikatVrednost } from './polja'

export * from './operatori'
export * as Polje from './polja'

// -------------------------------------------------------------------------------------
// Филтер
// -------------------------------------------------------------------------------------
//
// Филтер је форма чији је payload — скуп критеријума. Тиме добија распоред, правила и
// декодовање из `Form.object`, а разлика је само у томе што празно поље испада уместо да
// падне на валидацији.

export type FilterSpec<F extends Fields> = {
  readonly polja: F
  readonly forma: FormSpec<F>
  readonly layout: (field: FieldRenderer<F>) => React.ReactElement
}

const jePredikatsko = (polje: unknown): boolean =>
  typeof polje === 'object' && polje !== null && (polje as { zahtevaPredikat?: boolean }).zahtevaPredikat === true

/**
 * Саставља филтер и одмах проверава да ли профил уме да пренесе тражена поља. Предикат
 * постоји само на Java страни; .NET прима голу вредност, па оваква комбинација пада при
 * дизању модула — а не тек кад корисник отвори филтер у продукцији.
 */
export const napraviFilter = <F extends Fields>(
  profile: BackendProfile,
  fields: F,
  layout: (field: FieldRenderer<F>) => React.ReactElement,
): FilterSpec<F> => {
  if (profile.id !== 'java') {
    const predikatska = Object.keys(fields).filter(k => jePredikatsko(fields[k]))
    if (predikatska.length > 0) {
      throw new Error(
        `Профил "${profile.id}" не подржава предикатска поља: ${predikatska.join(', ')}. ` +
          'Употребите обичну варијанту поља (или Од/До пар).',
      )
    }
  }
  return { polja: fields, forma: Form.object(fields), layout }
}

/**
 * Обрнут смер: критеријуми прочитани из адресне линије се уписују у форму, да отворена
 * фиока показује оно по чему је листа заиста претражена (освежавање, дељен линк, „назад").
 */
export const izKriterijuma = <F extends Fields>(
  spec: FilterSpec<F>,
  criteria: AnyCriteria,
): [FormModel<F>, Cmd.Cmd<FormMsg<F>>] => {
  const [model, cmd] = spec.forma.create()
  const vrednosti: Record<string, unknown> = {}
  for (const kljuc of Object.keys(spec.polja)) {
    const vrednost = criteria[kljuc]
    if (vrednost === undefined) continue
    if (jePredikatsko(spec.polja[kljuc])) {
      // Предикат стиже као поновљен кључ; ако га неко ручно скрати на голу вредност,
      // остаје подразумевани оператор поља.
      const podrazumevani = (spec.polja[kljuc].empty as PredikatVrednost)[0]
      vrednosti[kljuc] = Array.isArray(vrednost)
        ? [String(vrednost[0] ?? podrazumevani), String(vrednost[1] ?? '')]
        : [podrazumevani, String(vrednost)]
    } else {
      vrednosti[kljuc] = Array.isArray(vrednost) ? String(vrednost[0] ?? '') : String(vrednost)
    }
  }
  return [spec.forma.setValues(model, vrednosti as Partial<Draft<F>>), cmd]
}

/** Нацрт филтера у критеријуме: празна поља испадају. */
export const uKriterijume = <F extends Fields>(spec: FilterSpec<F>, model: FormModel<F>): AnyCriteria => {
  const [, payload] = spec.forma.trySubmit(model)
  return Option.match(payload, {
    onNone: () => ({}),
    onSome: vrednosti => {
      const criteria: Record<string, Predicate> = {}
      for (const [kljuc, vrednost] of Object.entries(vrednosti as Record<string, Predicate | undefined>)) {
        if (vrednost !== undefined) criteria[kljuc] = vrednost
      }
      return criteria
    },
  })
}

// -------------------------------------------------------------------------------------
// Фиока
// -------------------------------------------------------------------------------------

export type FiokaProps<F extends Fields> = {
  readonly spec: FilterSpec<F>
  readonly model: FormModel<F>
  readonly otvorena: boolean
  readonly dispatch: (msg: FormMsg<F>) => void
  readonly onPretrazi: () => void
  readonly onOcisti: () => void
  readonly onZatvori: () => void
}

export const Fioka = <F extends Fields>(props: FiokaProps<F>) => {
  const field: FieldRenderer<F> = kljuc => props.spec.forma.render(props.model, kljuc)(props.dispatch)

  return (
    <Drawer type="overlay" separator position="end" open={props.otvorena} size="medium" onOpenChange={props.onZatvori}>
      <DrawerHeader>
        <DrawerHeaderTitle action={<Button appearance="subtle" icon={<DismissRegular />} onClick={props.onZatvori} />}>
          {t(S.filter.naslov)}
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>
        <Stack vertical gap="l">
          {props.spec.layout(field)}
          <Stack gap="m">
            <Button appearance="primary" onClick={props.onPretrazi}>
              {t(S.filter.pretrazi)}
            </Button>
            <Button appearance="secondary" onClick={props.onOcisti}>
              {t(S.filter.ocisti)}
            </Button>
          </Stack>
        </Stack>
      </DrawerBody>
    </Drawer>
  )
}
