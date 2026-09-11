import { uLatinicu } from './transliteracija'
import { trenutnoPismo } from './pismo'

// -------------------------------------------------------------------------------------
// Локализација Fluent календара
// -------------------------------------------------------------------------------------
//
// `DatePicker` без `strings` исписује енглеске називе месеци усред српског екрана. Извор
// је, као и свуда, ћирилица — латиница се изводи истом функцијом, па прекидач писма важи
// и унутар календара.

const MESECI = [
  'јануар',
  'фебруар',
  'март',
  'април',
  'мај',
  'јун',
  'јул',
  'август',
  'септембар',
  'октобар',
  'новембар',
  'децембар',
] as const

const MESECI_SKRACENO = ['јан', 'феб', 'мар', 'апр', 'мај', 'јун', 'јул', 'авг', 'сеп', 'окт', 'нов', 'дец'] as const

// Fluent очекује недељу на нултом месту, без обзира на то што недеља почиње понедељком.
const DANI = ['недеља', 'понедељак', 'уторак', 'среда', 'четвртак', 'петак', 'субота'] as const

export const DANI_SKRACENO = ['не', 'по', 'ут', 'ср', 'че', 'пе', 'су'] as const

const upismo = (tekst: string): string => (trenutnoPismo() === 'latinica' ? uLatinicu(tekst) : tekst)

/**
 * Функција, не константа: писмо се мења за време рада, па се текстови састављају при
 * сваком исцртавању. Реч је о двадесетак низова — јефтиније од било каквог кеширања које
 * би требало поништавати.
 */
export const kalendarskiTekstovi = () => ({
  months: MESECI.map(upismo),
  shortMonths: MESECI_SKRACENO.map(upismo),
  days: DANI.map(upismo),
  shortDays: DANI_SKRACENO.map(upismo),
  goToToday: upismo('Данас'),
  prevMonthAriaLabel: upismo('Претходни месец'),
  nextMonthAriaLabel: upismo('Следећи месец'),
  prevYearAriaLabel: upismo('Претходна година'),
  nextYearAriaLabel: upismo('Следећа година'),
  monthPickerHeaderAriaLabel: upismo('{0}, избор године'),
  yearPickerHeaderAriaLabel: upismo('{0}, избор месеца'),
  isRequiredErrorMessage: upismo('Обавезно поље'),
  invalidInputErrorMessage: upismo('Неисправан датум'),
})
