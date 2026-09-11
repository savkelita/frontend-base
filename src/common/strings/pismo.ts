import { Schema as S } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import * as LocalStorage from 'tea-effect/LocalStorage'
import { pismo as izKonfiguracije } from '../../config'

// -------------------------------------------------------------------------------------
// Писмо
// -------------------------------------------------------------------------------------
//
// Извор текста је ћирилица; латиница се изводи (види `transliteracija.ts`). Које писмо
// важи одлучује — овим редом — корисник, па инстанца:
//
//   1. преференца из localStorage-а   (корисник је бирао на овом уређају)
//   2. `pismo` из config.json         (како је инстанца подешена)
//
// Тренутно писмо стоји и у модулу, јер `t()` мора да ради из било ког вида без
// провлачења кроз пропове. Извор истине је ипак модел: корени `view` пре исцртавања
// усклађује модул са моделом, па се то двоје не могу разићи.

export type Pismo = 'cirilica' | 'latinica'

export const sPismo = S.Literal('cirilica', 'latinica')

export const PISMO_KLJUC = 'pismo'

export const suprotno = (pismo: Pismo): Pismo => (pismo === 'cirilica' ? 'latinica' : 'cirilica')

let tekuce: Pismo = 'cirilica'

/** Поставља писмо за цео модул. Зове га корени `view`, из модела. */
export const postaviPismo = (pismo: Pismo): void => {
  tekuce = pismo
}

export const trenutnoPismo = (): Pismo => tekuce

/**
 * Синхроно читање преференце. Асинхроно (кроз `Cmd`) значило би да се прво исцрта једно
 * писмо па одмах друго — приметан трзај на сваком подизању.
 */
const zapamceno = (): Pismo | undefined => {
  try {
    const sirovo = globalThis.localStorage?.getItem(PISMO_KLJUC)
    if (sirovo === null || sirovo === undefined) return undefined
    const vrednost = JSON.parse(sirovo) as unknown
    return vrednost === 'cirilica' || vrednost === 'latinica' ? vrednost : undefined
  } catch {
    // Приватни режим, искључени колачићи: преференце просто нема.
    return undefined
  }
}

/** Писмо при подизању: преференца ако постоји, иначе подешавање инстанце. */
export const pocetnoPismo = (): Pismo => zapamceno() ?? izKonfiguracije()

/** Упис преференце. Неуспех се прећуткује — избор писма није вредан рушења екрана. */
export const zapamti = (pismo: Pismo): Cmd.Cmd<never> => LocalStorage.setIgnoreErrors(PISMO_KLJUC, sPismo, pismo)
