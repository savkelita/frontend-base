import { describe, it, expect } from 'vitest'
import { uLatinicu } from './transliteracija'
import { postaviPismo, t } from './index'

describe('транслитерација', () => {
  it('пресликава дигафе', () => {
    expect(uLatinicu('љубав')).toBe('ljubav')
    expect(uLatinicu('њива')).toBe('njiva')
    expect(uLatinicu('џак')).toBe('džak')
  })

  it('верзал дигафа испред верзала даје оба велика слова', () => {
    expect(uLatinicu('ЉУБАВ')).toBe('LJUBAV')
    expect(uLatinicu('Љубав')).toBe('Ljubav')
  })

  it('чува дијакритике', () => {
    expect(uLatinicu('Шифра ђака је ћирилична')).toBe('Šifra đaka je ćirilična')
  })

  it('не дира оно што није ћирилица', () => {
    expect(uLatinicu('ID 42 — otpremnica/stavke')).toBe('ID 42 — otpremnica/stavke')
  })

  it('превод целе реченице', () => {
    expect(uLatinicu('Креирање ставке отпремнице')).toBe('Kreiranje stavke otpremnice')
  })
})

describe('избор писма', () => {
  it('ћирилица је подразумевана и пролази нетакнуто', () => {
    postaviPismo('cirilica')
    expect(t('Сачувај')).toBe('Сачувај')
  })

  it('латиница се изводи', () => {
    postaviPismo('latinica')
    expect(t('Сачувај')).toBe('Sačuvaj')
    postaviPismo('cirilica')
  })
})
