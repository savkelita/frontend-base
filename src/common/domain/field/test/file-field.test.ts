import { Schema } from 'effect'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { render, validate, type Options } from '../../../form'
import * as Fajl from '../../fajl'
import { extension, formatSize, isAccepted } from '../file-field'

type Value = { readonly x: Fajl.Form }

const vForm = () => Schema.Struct({ x: Fajl.vForm })

const draw = (value: Fajl.Form, field: Fajl.FieldOptions = {}) => {
  const options: Options<Value> = { template: l => l.inputs.x, fields: { x: { label: 'Dokument', ...field } } }
  return renderToStaticMarkup(render({ schema: vForm(), value: { x: value }, onChange: () => {}, options }) as never)
}

const fajl = (naziv: string): Fajl.Value => ({ naziv, sadrzaj: 'AAAA' })

describe('extension', () => {
  it('uzima poslednji deo posle tacke, malim slovima', () => {
    expect(extension('ugovor.PDF')).toBe('pdf')
    expect(extension('arhiva.tar.gz')).toBe('gz')
  })

  it('bez tacke vraca ceo naziv', () => {
    expect(extension('README')).toBe('readme')
  })
})

describe('isAcceptednje formata', () => {
  it('bez ogranicenja prolazi sve', () => {
    expect(isAccepted(undefined, 'nesto.exe')).toBe(true)
  })

  it('poredi ekstenziju bez obzira na velika slova i razmake', () => {
    expect(isAccepted('.pdf, .docx', 'ugovor.PDF')).toBe(true)
    expect(isAccepted('.pdf,.docx', 'slika.png')).toBe(false)
  })

  // Pregledac ume da filtrira po MIME tipu, provera ovde ne ume — zato ne odbija.
  it('mime tip se prepusta pregledacu', () => {
    expect(isAccepted('image/*', 'slika.png')).toBe(true)
  })
})

describe('formatSize', () => {
  it('ispod megabajta ide u KB', () => {
    expect(formatSize(512 * 1024)).toBe('512 KB')
  })

  it('preko megabajta ide u MB sa jednom decimalom', () => {
    expect(formatSize(5 * 1024 * 1024)).toBe('5.0 MB')
  })
})

describe('validacija', () => {
  it('prazno polje je greska', () => {
    const result = validate(vForm, { x: null })
    expect(result.isValid).toBe(false)
    if (result.isValid) return
    expect(result.issues[0]?.message).toBe('Podatak je obavezan')
  })

  it('izabran fajl prolazi', () => {
    expect(validate(vForm, { x: fajl('ugovor.pdf') }).isValid).toBe(true)
  })

  // Opciono polje se pise kao NullOr, isto kao svako drugo.
  it('opciono polje prolazi i prazno', () => {
    const opciono = () => Schema.Struct({ x: Schema.NullOr(Fajl.vForm) })
    expect(validate(opciono, { x: null }).isValid).toBe(true)
  })
})

describe('prikaz', () => {
  it('prazno polje poziva na izbor i nosi oznaku', () => {
    const markup = draw(null)
    expect(markup).toContain('Dokument')
    expect(markup).toContain('Prevucite fajl ovde')
    expect(markup).toContain('type="file"')
  })

  it('podrazumevana granica stoji u pozivu', () => {
    expect(draw(null)).toContain('Najvise 5.0 MB')
  })

  it('zadata granica menja poziv', () => {
    expect(draw(null, { maxBytes: 512 * 1024 })).toContain('Najvise 512 KB')
  })

  it('ogranicenje formata stize do input-a', () => {
    expect(draw(null, { accept: '.pdf' })).toContain('accept=".pdf"')
  })

  // Kutija ostaje ista, menja se samo sadrzaj — zato forma ne poskoci.
  it('izabran fajl pokazuje naziv i obe radnje', () => {
    const markup = draw(fajl('ugovor.pdf'))
    expect(markup).toContain('ugovor.pdf')
    expect(markup).toContain('Zameni')
    expect(markup).toContain('Ukloni')
    expect(markup).not.toContain('Prevucite fajl ovde')
  })

  it('velicina se cita iz sadrzaja, bez dodatnog polja', () => {
    expect(draw({ naziv: 'ugovor.pdf', sadrzaj: 'A'.repeat(4 * 1024) })).toContain('3 KB')
  })

  // Prazna kutija je dugme; kad fajl postoji, radnje su prava dugmad u njoj.
  it('kutija je klikabilna samo dok je prazna', () => {
    expect(draw(null)).toContain('role="button"')
    expect(draw(fajl('ugovor.pdf'))).not.toContain('role="button"')
  })

  // Sadrzaj je base64 i ume da bude ogroman — u DOM-u nema sta da trazi.
  it('sadrzaj se ne ispisuje', () => {
    expect(draw({ naziv: 'ugovor.pdf', sadrzaj: 'TAJNIBASE64' })).not.toContain('TAJNIBASE64')
  })
})
