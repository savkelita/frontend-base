import { Option, ParseResult, Schema } from 'effect'
import * as Http from 'tea-effect/Http'

const XSRF_COOKIE = 'XSRF-TOKEN'

const XSRF_HEADER = 'X-XSRF-TOKEN'

export const readCookie = (name: string, cookie: string): Option.Option<string> => {
  for (const part of cookie.split(';')) {
    const at = part.indexOf('=')
    if (at === -1) continue
    if (part.slice(0, at).trim() !== name) continue
    return Option.some(decodeURIComponent(part.slice(at + 1).trim()))
  }
  return Option.none()
}

export const withSession = <A>(request: Http.Request<A>): Http.Request<A> => {
  const cookie = typeof document === 'undefined' ? '' : document.cookie
  const withCookies = Http.withCredentials(request)
  return Option.match(readCookie(XSRF_COOKIE, cookie), {
    onNone: () => withCookies,
    onSome: token => Http.withHeader(XSRF_HEADER, token)(withCookies),
  })
}

const isEmpty = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  value === '' ||
  (typeof value === 'object' && Object.keys(value).length === 0)

const NoContent = Schema.declare<void, void, readonly []>(
  [],
  {
    decode: () => (input, _options, ast) =>
      isEmpty(input) ? ParseResult.succeed(undefined) : ParseResult.fail(new ParseResult.Type(ast, input)),
    encode: () => () => ParseResult.succeed(undefined),
  },
  { identifier: 'NoContent' },
)

export const expectNoContent: Http.Expect<void> = { _tag: 'ExpectString', decoder: NoContent }

export const get = <A>(url: string, expect: Http.Expect<A>): Http.Request<A> => withSession(Http.get(url, expect))

export const post = <A>(url: string, body: Http.Body, expect: Http.Expect<A>): Http.Request<A> =>
  withSession(Http.post(url, body, expect))
