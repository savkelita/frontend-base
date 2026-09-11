import { uLatinicu } from './transliteracija'
import { trenutnoPismo } from './pismo'

// -------------------------------------------------------------------------------------
// Текстови апликације
// -------------------------------------------------------------------------------------
//
// Један извор, ћирилицом. Латиница се изводи, не одржава се напоредо.
//
// Правило: у JSX-у нема слободног текста (`react/jsx-no-literals`), па сваки текст пролази
// овуда. Тиме избор писма важи за целу апликацију, укључујући и екране написане пре него
// што је прекидач уведен.

/** Преводи текст у тренутно писмо. Извор је увек ћирилица. */
export const t = (tekst: string): string => (trenutnoPismo() === 'latinica' ? uLatinicu(tekst) : tekst)

export { uLatinicu }
export { S, popuni } from './tekstovi'
export { PISMO_KLJUC, pocetnoPismo, postaviPismo, sPismo, suprotno, trenutnoPismo, zapamti } from './pismo'
export type { Pismo } from './pismo'
export { kalendarskiTekstovi, DANI_SKRACENO } from './kalendar'
