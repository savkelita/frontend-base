import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AppHeader } from '../components/app-header'
import { Msg } from '../msg'

const draw = (username = 'Petar Petrovic', uloga = 'Administrator'): string =>
  renderToStaticMarkup(createElement(AppHeader, { isOpen: true, username, uloga, dispatch: () => {} }))

const poruke = (username = 'Petar Petrovic'): ReadonlyArray<Msg> => {
  const sent: Array<Msg> = []
  renderToStaticMarkup(
    createElement(AppHeader, {
      isOpen: true,
      username,
      uloga: 'Administrator',
      dispatch: (msg: Msg) => void sent.push(msg),
    }),
  )
  return sent
}

describe('badge korisnika', () => {
  it('ispisuje ime u zaglavlju', () => {
    expect(draw()).toContain('Petar Petrovic')
  })

  it('avatar nosi inicijale imena i prezimena', () => {
    expect(draw()).toContain('PP')
  })

  it('citacu ekrana kaze cije je dugme', () => {
    expect(draw()).toContain('Nalog korisnika Petar Petrovic')
  })

  it('uloga ne zauzima mesto u zaglavlju', () => {
    expect(draw('Petar Petrovic', 'Referent za kazne')).not.toContain('Referent za kazne')
  })

  it('samo iscrtavanje ne salje nijednu poruku', () => {
    expect(poruke()).toStrictEqual([])
  })
})
