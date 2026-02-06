import { describe, it, expect } from 'vitest'
import { Option } from 'effect'
import * as Cmd from 'tea-effect/Cmd'
import { Msg } from './msg'
import { init, update } from './index'

describe('Products', () => {
  describe('init', () => {
    it('should start loading products', () => {
      const [model, cmd] = init
      expect(model.products).toEqual([])
      expect(model.isLoading).toBe(true)
      expect(Option.isNone(model.error)).toBe(true)
      expect(cmd).not.toBe(Cmd.none)
    })
  })

  describe('update', () => {
    it('should set isLoading on LoadProducts', () => {
      const [model] = init
      const idle = { ...model, isLoading: false }
      const [newModel, cmd] = update(Msg.LoadProducts(), idle)
      expect(newModel.isLoading).toBe(true)
      expect(Option.isNone(newModel.error)).toBe(true)
      expect(cmd).not.toBe(Cmd.none)
    })

    it('should set products on successful ProductsLoaded', () => {
      const [model] = init
      const products = [
        { id: 1, title: 'Phone', category: 'smartphones', price: 549, rating: 4.5, stock: 10, thumbnail: 'img.jpg' },
      ]
      const [newModel, cmd] = update(Msg.ProductsLoaded({ response: { products, total: 1 } }), model)
      expect(newModel.products).toEqual(products)
      expect(newModel.isLoading).toBe(false)
      expect(Option.isNone(newModel.error)).toBe(true)
      expect(cmd).toBe(Cmd.none)
    })

    it('should set error on ProductsFailed', () => {
      const [model] = init
      const [newModel, cmd] = update(
        Msg.ProductsFailed({ error: { _tag: 'NetworkError' as const, error: 'timeout' } }),
        model,
      )
      expect(newModel.products).toEqual([])
      expect(newModel.isLoading).toBe(false)
      expect(Option.isSome(newModel.error)).toBe(true)
      expect(cmd).toBe(Cmd.none)
    })
  })
})
