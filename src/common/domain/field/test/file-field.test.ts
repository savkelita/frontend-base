import { Schema } from 'effect'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { render, validate, type Options } from '../../../form'
import * as FileDomain from '../../file'
import { extension, formatSize, isAccepted } from '../file-field'

type Value = { readonly x: FileDomain.Form }

const vForm = () => Schema.Struct({ x: FileDomain.vForm })

const draw = (value: FileDomain.Form, field: FileDomain.FieldOptions = {}) => {
  const options: Options<Value> = { template: l => l.inputs.x, fields: { x: { label: 'Dokument', ...field } } }
  return renderToStaticMarkup(render({ schema: vForm(), value: { x: value }, onChange: () => {}, options }) as never)
}

const file = (name: string): FileDomain.Value => ({ name, content: 'AAAA' })

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
    expect(validate(vForm, { x: file('ugovor.pdf') }).isValid).toBe(true)
  })

  it('opciono polje prolazi i prazno', () => {
    const optional = () => Schema.Struct({ x: Schema.NullOr(FileDomain.vForm) })
    expect(validate(optional, { x: null }).isValid).toBe(true)
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

  it('izabran fajl pokazuje naziv i obe radnje', () => {
    const markup = draw(file('ugovor.pdf'))
    expect(markup).toContain('ugovor.pdf')
    expect(markup).toContain('Zameni')
    expect(markup).toContain('Ukloni')
    expect(markup).not.toContain('Prevucite fajl ovde')
  })

  it('velicina se cita iz sadrzaja, bez dodatnog polja', () => {
    expect(draw({ name: 'ugovor.pdf', content: 'A'.repeat(4 * 1024) })).toContain('3 KB')
  })

  it('kutija je klikabilna samo dok je prazna', () => {
    expect(draw(null)).toContain('role="button"')
    expect(draw(file('ugovor.pdf'))).not.toContain('role="button"')
  })

  it('sadrzaj se ne ispisuje', () => {
    expect(draw({ name: 'ugovor.pdf', content: 'TAJNIBASE64' })).not.toContain('TAJNIBASE64')
  })
})
