export const memoize = <A extends object, B>(f: (a: A) => B): ((a: A) => B) => {
  const cache = new WeakMap<A, B>()
  return a => {
    if (cache.has(a)) return cache.get(a) as B
    const value = f(a)
    cache.set(a, value)
    return value
  }
}
