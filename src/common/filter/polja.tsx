import * as S from 'effect/Schema'
import * as Cmd from 'tea-effect/Cmd'
import { Field, Menu, MenuButton, MenuItemRadio, MenuList, MenuPopover, MenuTrigger } from '@fluentui/react-components'
import type { FieldDef, SelectOption } from '../forms'
import { BoolWidget, DateWidget, NumberWidget, SelectWidget, TextWidget } from '../forms/widgets'
import type { WidgetProps } from '../forms/widgets'
import type { Predicate } from '../platform'
import { t } from '../strings'
import { jeIzmedju, polovine, spoji } from './operatori'
import type { SkupOperatora } from './operatori'

// -------------------------------------------------------------------------------------
// Поља филтера
// -------------------------------------------------------------------------------------
//
// Филтер је обична форма: `Form.object` над овим пољима даје распоред, правила и
// декодовање. Разлика је само у томе што се нацрт декодује у `Predicate | undefined` —
// празно поље испада из критеријума уместо да падне на валидацији.

/** Празна вредност испада из критеријума. */
const kriterijum = <A,>(prazno: (v: A) => boolean) =>
  S.transform(S.Any, S.Any, {
    strict: false,
    decode: (v: A) => (prazno(v) ? undefined : v),
    encode: (v: unknown) => v as A,
  }) as unknown as S.Schema<Predicate | undefined, A>

const prazanTekst = (v: string) => v.trim() === ''

type Osnovno = { readonly label: string }

const obicnoPolje = <V,>(cfg: {
  readonly label: string
  readonly prazno: V
  readonly jePrazno: (v: V) => boolean
  readonly widget: (props: WidgetProps<V>) => React.ReactElement
  readonly widgetConfig?: Record<string, unknown>
}): FieldDef<V, V, V, Predicate | undefined> => {
  const W = cfg.widget
  return {
    schema: kriterijum<V>(cfg.jePrazno),
    empty: cfg.prazno,
    required: false,
    init: v => [v, Cmd.none],
    value: s => s,
    set: (_s, v) => v,
    update: (msg, _s) => [msg, Cmd.none],
    changed: (msg, prethodno) => msg !== prethodno,
    view: (state, ui) => dispatch => (
      <W
        label={t(cfg.label)}
        value={state}
        required={false}
        disabled={!ui.enabled || ui.readonly}
        config={cfg.widgetConfig}
        onChange={v => dispatch(v)}
        onBlur={() => {}}
      />
    ),
  }
}

// --- обична поља: вредност иде гола, без оператора (оба backend-а) ---

export const tekst = (cfg: Osnovno) =>
  obicnoPolje<string>({ label: cfg.label, prazno: '', jePrazno: prazanTekst, widget: TextWidget })

export const broj = (cfg: Osnovno) =>
  obicnoPolje<string>({ label: cfg.label, prazno: '', jePrazno: prazanTekst, widget: NumberWidget })

export const datum = (cfg: Osnovno) =>
  obicnoPolje<string>({ label: cfg.label, prazno: '', jePrazno: prazanTekst, widget: DateWidget })

export const izbor = (cfg: Osnovno & { readonly options: ReadonlyArray<SelectOption> }) =>
  obicnoPolje<string>({
    label: cfg.label,
    prazno: '',
    jePrazno: prazanTekst,
    widget: SelectWidget,
    widgetConfig: { options: cfg.options },
  })

export const logicki = (cfg: Osnovno) =>
  obicnoPolje<string>({
    label: cfg.label,
    prazno: '',
    jePrazno: prazanTekst,
    widget: SelectWidget,
    widgetConfig: {
      options: [
        { value: 'true', label: 'да' },
        { value: 'false', label: 'не' },
      ],
    },
  })

export { BoolWidget }

// -------------------------------------------------------------------------------------
// Предикатско поље — само Java
// -------------------------------------------------------------------------------------
//
// Вредност је н-торка `[оператор, текст]`, која на жици постаје поновљен кључ:
//
//   sifra=contains&sifra=ABC
//
// Поље носи ознаку `zahtevaPredikat`, по којој `napraviFilter` одбија .NET профил.

export type PredikatVrednost = readonly [string, string]

export type PredikatskoPolje = FieldDef<PredikatVrednost, PredikatVrednost, PredikatVrednost, Predicate | undefined> & {
  readonly zahtevaPredikat: true
}

// Полупразан `between` (само доња или само горња граница) сервер не уме да обради, па
// испада исто као сасвим празно поље.
const predikatPrazan = ([operator, vrednost]: PredikatVrednost): boolean => {
  if (!jeIzmedju(operator)) return vrednost.trim() === ''
  const [od, doVrednosti] = polovine(vrednost)
  return od.trim() === '' || doVrednosti.trim() === ''
}

const predikatSchema = S.transform(S.Any, S.Any, {
  strict: false,
  decode: (v: PredikatVrednost) => (predikatPrazan(v) ? undefined : v),
  encode: (v: unknown) => v as PredikatVrednost,
}) as unknown as S.Schema<Predicate | undefined, PredikatVrednost>

export const predikat = (cfg: {
  readonly label: string
  readonly operatori: SkupOperatora
  readonly podrazumevani: string
  readonly widget?: (props: WidgetProps<string>) => React.ReactElement
}): PredikatskoPolje => {
  const W = cfg.widget ?? TextWidget
  const prazno: PredikatVrednost = [cfg.podrazumevani, '']
  return {
    zahtevaPredikat: true,
    schema: predikatSchema,
    empty: prazno,
    required: false,
    init: v => [v, Cmd.none],
    value: s => s,
    set: (_s, v) => v,
    update: (msg, _s) => [msg, Cmd.none],
    changed: (msg, prethodno) => msg[0] !== prethodno[0] || msg[1] !== prethodno[1],
    view: (state, ui) => dispatch => {
      const [operator, vrednost] = state
      const onemoguceno = !ui.enabled || ui.readonly
      return (
        <Field label={t(cfg.label)}>
          <div style={{ display: 'flex', gap: 6 }}>
            <Menu
              checkedValues={{ operator: [operator] }}
              onCheckedValueChange={(_e, { checkedItems }) => dispatch([checkedItems[0] ?? operator, vrednost])}
            >
              <MenuTrigger disableButtonEnhancement>
                <MenuButton disabled={onemoguceno} style={{ whiteSpace: 'nowrap' }}>
                  {cfg.operatori[operator] ?? operator}
                </MenuButton>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  {Object.entries(cfg.operatori).map(([kljuc, oznaka]) => (
                    <MenuItemRadio key={kljuc} name="operator" value={kljuc}>
                      {oznaka}
                    </MenuItemRadio>
                  ))}
                </MenuList>
              </MenuPopover>
            </Menu>
            {jeIzmedju(operator) ? (
              // Између: две границе у једном пољу, спојене тилдом тек при слању.
              ((): React.ReactElement => {
                const [od, doVrednosti] = polovine(vrednost)
                return (
                  <>
                    <div style={{ flexGrow: 1 }}>
                      <W
                        label=""
                        value={od}
                        required={false}
                        disabled={onemoguceno}
                        onChange={v => dispatch([operator, spoji(v, doVrednosti)])}
                        onBlur={() => {}}
                      />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <W
                        label=""
                        value={doVrednosti}
                        required={false}
                        disabled={onemoguceno}
                        onChange={v => dispatch([operator, spoji(od, v)])}
                        onBlur={() => {}}
                      />
                    </div>
                  </>
                )
              })()
            ) : (
              <div style={{ flexGrow: 1 }}>
                <W
                  label=""
                  value={vrednost}
                  required={false}
                  disabled={onemoguceno}
                  onChange={v => dispatch([operator, v])}
                  onBlur={() => {}}
                />
              </div>
            )}
          </div>
        </Field>
      )
    },
  }
}

/** Скраћенице за најчешће предикате. */
export const tekstPredikat = (cfg: Osnovno & { readonly operatori: SkupOperatora; readonly podrazumevani: string }) =>
  predikat({ label: cfg.label, operatori: cfg.operatori, podrazumevani: cfg.podrazumevani })

export const brojPredikat = (cfg: Osnovno & { readonly operatori: SkupOperatora; readonly podrazumevani: string }) =>
  predikat({ label: cfg.label, operatori: cfg.operatori, podrazumevani: cfg.podrazumevani, widget: NumberWidget })

export const datumPredikat = (cfg: Osnovno & { readonly operatori: SkupOperatora; readonly podrazumevani: string }) =>
  predikat({ label: cfg.label, operatori: cfg.operatori, podrazumevani: cfg.podrazumevani, widget: DateWidget })
