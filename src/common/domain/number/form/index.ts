import { Schema } from 'effect'
import * as Annotation from 'effect-form/Annotation'
import { format, normalize, numberField, type NumberForm } from '../../field/number-field'

export type Form = NumberForm

const patternFor = (decimals: number): RegExp => (decimals === 0 ? /^-?\d+$/ : /^-?\d+(\.\d+)?$/)

const round = (n: number, decimals: number): number => Number(n.toFixed(decimals))

const integerDigits = (text: string): number => (text.replace('-', '').split('.')[0] ?? '').length

export const vForm = (decimals: number, maxIntegerDigits: number) => {
  const pattern = patternFor(decimals)

  const digits = Schema.String.pipe(
    Schema.transform(Schema.String, { strict: true, decode: normalize, encode: text => text }),
    Schema.filter(text =>
      text === ''
        ? 'prazno'
        : !pattern.test(text)
          ? 'nije broj'
          : integerDigits(text) > maxIntegerDigits
            ? 'previse cifara'
            : undefined,
    ),
  )

  return Schema.transform(digits, Schema.Number, {
    strict: true,
    decode: (text: string) => round(Number(text), decimals),
    encode: (n: number) => format(n, decimals),
  }).pipe(
    Annotation.template(numberField(decimals)),
    Annotation.message((value: Form) => {
      if (value === null || value.trim() === '') return 'Podatak je obavezan'
      const text = normalize(value)
      if (!pattern.test(text)) return decimals === 0 ? 'Unesite ceo broj' : 'Unesite broj'
      if (integerDigits(text) > maxIntegerDigits) {
        return decimals === 0
          ? `Unesena vrednost ne sme imati vise od ${maxIntegerDigits} cifara`
          : `Unesena vrednost ne sme imati vise od ${maxIntegerDigits} cifara ispred zareza`
      }
      return undefined
    }),
  )
}
