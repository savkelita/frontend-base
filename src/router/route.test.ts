import { describe, it, expect } from 'vitest'
import { Option } from 'effect'
import { parse, putanja, routes, skiniPrefiks } from './route'

// -------------------------------------------------------------------------------------
// Префикс инстанце решен на једном месту
// -------------------------------------------------------------------------------------
//
// Тестови гађају чисту функцију, јер прави префикс долази из конфигурације коју тестови
// држе на кореној вредности. Битно је правило: путања која не припада инстанци НЕ сме да
// се протумачи као да префикса није ни било.

describe('skiniPrefiks', () => {
  it('без префикса путања пролази нетакнута', () => {
    expect(skiniPrefiks('', '/otpremnice/1/stavke')).toBe('/otpremnice/1/stavke')
  })

  it('гола адреса инстанце је корен', () => {
    expect(skiniPrefiks('/Magacin1', '/Magacin1')).toBe('/')
    expect(skiniPrefiks('/Magacin1', '/Magacin1/')).toBe('/')
  })

  it('скида префикс са дубље путање', () => {
    expect(skiniPrefiks('/Magacin1', '/Magacin1/otpremnice/1/stavke')).toBe('/otpremnice/1/stavke')
  })

  it('туђа путања се одбија, не тумачи', () => {
    expect(skiniPrefiks('/Magacin1', '/Magacin2/otpremnice')).toBeUndefined()
    expect(skiniPrefiks('/Magacin1', '/otpremnice')).toBeUndefined()
  })

  it('име које само почиње префиксом није унутар инстанце', () => {
    expect(skiniPrefiks('/Magacin1', '/Magacin10/otpremnice')).toBeUndefined()
  })
})

describe('parse i putanja', () => {
  const lokacija = (pathname: string) => ({ pathname, search: '', hash: '', href: pathname, origin: '' })

  it('препознаје руту са параметром', () => {
    const ruta = parse(lokacija('/otpremnice/7/stavke'))
    expect(Option.isSome(ruta)).toBe(true)
    if (Option.isSome(ruta) && ruta.value._tag === 'otpremnicaStavke') {
      expect(ruta.value.params.otpremnicaID).toBe(7)
    }
  })

  it('непозната путања нема руту', () => {
    expect(Option.isNone(parse(lokacija('/nepostojece')))).toBe(true)
  })

  it('оно што `putanja` испише, `parse` уме да прочита', () => {
    const ispisana = putanja(routes.otpremnicaStavke, { otpremnicaID: 3 })
    const ruta = parse(lokacija(ispisana))
    expect(Option.isSome(ruta)).toBe(true)
  })
})
