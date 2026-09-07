import { describe, it, expect } from 'vitest'
import * as S from 'effect/Schema'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import * as Combo from './index'

type Item = { readonly id: number; readonly naziv: string }

const cfg: Combo.Config<ReadonlyArray<Item>> = {
  search: () => Http.get('/x', Http.expectJson(S.Array(S.Struct({ id: S.Number, naziv: S.String })))),
  toOptions: items => items.map(i => ({ value: String(i.id), label: i.naziv })),
}

const opt = (value: string): { value: string; label: string } => ({ value, label: value })

describe('form/combo update', () => {
  it('QueryChanged sets loading, bumps seq, and issues a load command', () => {
    const [model, cmd] = Combo.update(cfg, Combo.Msg.QueryChanged({ query: 'ab' }), Combo.init)
    expect(model.loading).toBe(true)
    expect(model.query).toBe('ab')
    expect(model.seq).toBe(1)
    expect(cmd).not.toBe(Cmd.none)
  })

  it('Loaded (offset 0) with the current seq replaces the options', () => {
    const [loading] = Combo.update(cfg, Combo.Msg.QueryChanged({ query: 'ab' }), Combo.init)
    const [model] = Combo.update(
      cfg,
      Combo.Msg.Loaded({ seq: loading.seq, options: [opt('1')], total: 1, offset: 0 }),
      loading,
    )
    expect(model.loading).toBe(false)
    expect(model.options).toEqual([opt('1')])
  })

  it('keeps total so the view knows more pages remain', () => {
    const [loading] = Combo.update(cfg, Combo.Msg.QueryChanged({ query: 'ab' }), Combo.init)
    const [model] = Combo.update(
      cfg,
      Combo.Msg.Loaded({ seq: loading.seq, options: [opt('1')], total: 25, offset: 0 }),
      loading,
    )
    expect(model.total).toBe(25)
    expect(model.options.length).toBeLessThan(model.total)
  })

  it('LoadMore fetches at offset = rows loaded, and its Loaded appends the page', () => {
    // page 1 (10 rows) already loaded, total 15
    const page1 = {
      ...Combo.init,
      query: 'a',
      options: Array.from({ length: 10 }, (_, i) => opt(String(i))),
      total: 15,
    }
    const [loadingMore, cmd] = Combo.update(cfg, Combo.Msg.LoadMore(), page1)
    expect(loadingMore.loading).toBe(true)
    expect(cmd).not.toBe(Cmd.none)

    const [model] = Combo.update(
      cfg,
      Combo.Msg.Loaded({ seq: loadingMore.seq, options: [opt('10'), opt('11')], total: 15, offset: 10 }),
      loadingMore,
    )
    expect(model.options.length).toBe(12)
    expect(model.options.map(o => o.value)).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'])
  })

  it('LoadMore is ignored while a request is already in flight', () => {
    const [loading] = Combo.update(cfg, Combo.Msg.QueryChanged({ query: 'ab' }), Combo.init)
    const [model, cmd] = Combo.update(cfg, Combo.Msg.LoadMore(), loading)
    expect(model).toBe(loading)
    expect(cmd).toBe(Cmd.none)
  })

  it('QueryChanged restarts from the first page (replaces, not appends)', () => {
    const loaded = { ...Combo.init, query: 'a', options: [opt('0'), opt('1')], total: 15 }
    const [loading] = Combo.update(cfg, Combo.Msg.QueryChanged({ query: 'b' }), loaded)
    const [model] = Combo.update(
      cfg,
      Combo.Msg.Loaded({ seq: loading.seq, options: [opt('9')], total: 3, offset: 0 }),
      loading,
    )
    expect(model.options).toEqual([opt('9')])
  })

  it('Closed while loading MORE is ignored (the load-more row would otherwise close the list)', () => {
    const page1 = { ...Combo.init, query: 'a', options: [opt('0'), opt('1')], total: 15, open: true }
    const [loadingMore] = Combo.update(cfg, Combo.Msg.LoadMore(), page1)
    const [stillOpen] = Combo.update(cfg, Combo.Msg.Closed(), loadingMore)
    expect(stillOpen.open).toBe(true)

    const [idle] = Combo.update(
      cfg,
      Combo.Msg.Loaded({ seq: loadingMore.seq, options: [], total: 15, offset: 2 }),
      loadingMore,
    )
    const [closed] = Combo.update(cfg, Combo.Msg.Closed(), idle)
    expect(closed.open).toBe(false)
  })

  it('Closed puts the chosen label back in the input (typing without picking is discarded)', () => {
    const [picked] = Combo.update(cfg, Combo.Msg.Picked({ option: { value: '7', label: 'Seven' } }), Combo.init)
    // korisnik kuca preko izbora ali nikada ništa ne izabere
    const [typing] = Combo.update(cfg, Combo.Msg.QueryChanged({ query: 'Eig' }), picked)
    expect(typing.query).toBe('Eig')
    expect(Combo.value(typing)).toBe('7') // sam izbor je netaknut

    const [closed] = Combo.update(cfg, Combo.Msg.Closed(), typing)
    expect(closed.query).toBe('Seven') // unos se više ne razilazi sa vrednošću
    expect(Combo.value(closed)).toBe('7')
  })

  it('typing while a page fetch is pending releases the close guard', () => {
    const page1 = { ...Combo.init, query: 'a', options: [opt('0'), opt('1')], total: 15, open: true }
    const [loadingMore] = Combo.update(cfg, Combo.Msg.LoadMore(), page1)
    // odgovor za tu stranu sada se odbacuje kao zastareo, pa nikada ne bi obrisao zastavicu
    const [typing] = Combo.update(cfg, Combo.Msg.QueryChanged({ query: 'ab' }), loadingMore)
    const [closed] = Combo.update(cfg, Combo.Msg.Closed(), typing)
    expect(closed.open).toBe(false)
  })

  it('Closed with nothing chosen clears the leftover query', () => {
    const [typing] = Combo.update(cfg, Combo.Msg.QueryChanged({ query: 'abc' }), Combo.init)
    const [closed] = Combo.update(cfg, Combo.Msg.Closed(), typing)
    expect(closed.query).toBe('')
  })

  it('a multi combo keeps its query on close (the input shows the chosen labels, not the query)', () => {
    const multi: Combo.Config<ReadonlyArray<Item>> = { ...cfg, multiple: true }
    const [typing] = Combo.update(multi, Combo.Msg.QueryChanged({ query: 'abc' }), Combo.init)
    const [closed] = Combo.update(multi, Combo.Msg.Closed(), typing)
    expect(closed.query).toBe('abc')
  })

  describe('debounce', () => {
    it('QueryChanged does not search immediately — it schedules a Search for that seq', () => {
      const [model, cmd] = Combo.update(cfg, Combo.Msg.QueryChanged({ query: 'ab' }), Combo.init)
      expect(model.query).toBe('ab')
      expect(model.loading).toBe(true)
      expect(model.seq).toBe(1)
      expect(cmd).not.toBe(Cmd.none)

      const [searching, searchCmd] = Combo.update(cfg, Combo.Msg.Search({ seq: model.seq, query: 'ab' }), model)
      expect(searchCmd).not.toBe(Cmd.none)
      expect(searching.seq).toBe(1) // pretraga koristi seq koji je rezervisao pritisak tastera
    })

    it('a Search from a superseded keystroke never reaches the network', () => {
      const [first] = Combo.update(cfg, Combo.Msg.QueryChanged({ query: 'a' }), Combo.init)
      const [second] = Combo.update(cfg, Combo.Msg.QueryChanged({ query: 'ab' }), first)
      const [, staleCmd] = Combo.update(cfg, Combo.Msg.Search({ seq: first.seq, query: 'a' }), second)
      expect(staleCmd).toBe(Cmd.none)

      const [, freshCmd] = Combo.update(cfg, Combo.Msg.Search({ seq: second.seq, query: 'ab' }), second)
      expect(freshCmd).not.toBe(Cmd.none)
    })
  })

  it('drops a stale Loaded (seq from an older request)', () => {
    const [loading] = Combo.update(cfg, Combo.Msg.QueryChanged({ query: 'ab' }), Combo.init)
    const [model] = Combo.update(cfg, Combo.Msg.Loaded({ seq: 999, options: [opt('x')], total: 1, offset: 0 }), loading)
    expect(model.options).toEqual([])
  })

  it('Resolved hydrates the selection but is NOT a selection change (no cascade)', () => {
    const msg = Combo.Msg.Resolved({ option: { value: '5', label: 'Five' } })
    const [m] = Combo.update(cfg, msg, Combo.init)
    expect(Combo.value(m)).toBe('5')
    expect(Combo.isSelectionChange(msg)).toBe(false)
  })

  it('Picked selects the option; Cleared removes it', () => {
    const [picked] = Combo.update(cfg, Combo.Msg.Picked({ option: { value: '7', label: 'Seven' } }), Combo.init)
    expect(Combo.hasSelection(picked)).toBe(true)
    expect(Combo.value(picked)).toBe('7')

    const [cleared] = Combo.update(cfg, Combo.Msg.Cleared(), picked)
    expect(Combo.hasSelection(cleared)).toBe(false)
    expect(Combo.value(cleared)).toBe('')
  })

  it('Toggled (multi) adds then removes a value, keeping the list open', () => {
    const [a] = Combo.update(cfg, Combo.Msg.Toggled({ option: opt('1') }), { ...Combo.init, open: true })
    const [b] = Combo.update(cfg, Combo.Msg.Toggled({ option: opt('2') }), a)
    expect(Combo.values(b)).toEqual(['1', '2'])
    expect(b.open).toBe(true)

    const [c] = Combo.update(cfg, Combo.Msg.Toggled({ option: opt('1') }), b)
    expect(Combo.values(c)).toEqual(['2'])
    expect(Combo.isSelectionChange(Combo.Msg.Toggled({ option: opt('1') }))).toBe(true)
  })
})
