import { ApiError, type ServerError, type Severity } from './error'

export type ErrorReport = {
  readonly messages: ReadonlyArray<string>
  readonly severity: Severity
}

const message = (text: string): ErrorReport => ({ messages: [text], severity: 'ERROR' })

const fromServer = (errors: ReadonlyArray<ServerError>): ErrorReport => ({
  messages: errors.map(e => e.message),
  severity: errors.every(e => e.type === 'BUSINESS' && e.severity === 'WARNING') ? 'WARNING' : 'ERROR',
})

export const reportError = (error: ApiError): ErrorReport =>
  ApiError.$match(error, {
    BadRequest: ({ errors }) =>
      errors.length === 0
        ? message('Server je poslao gresku u neocekivanom obliku. Obratite se administratoru.')
        : fromServer(errors),
    Unauthorized: () => message('Nemate ovlascenje za ovu funkciju ili je sesija prekinuta.'),
    NotFound: () => message('Trazeni podatak ne postoji.'),
    ServerFailure: () => message('Doslo je do neocekivane greske na serveru. Obratite se administratoru.'),
    Unavailable: () => message('Server trenutno nije dostupan. Obratite se administratoru.'),
    Timeout: () => message('Server nije odgovorio u predvidjenom roku. Pokusajte ponovo.'),
    UnexpectedStatus: ({ status }) =>
      message(`Neocekivani status ${status} u odgovoru servera. Obratite se administratoru.`),
    NetworkError: () => message('Desio se problem u komunikaciji sa serverom. Proverite vezu.'),
    BadResponse: () => message('Server je poslao neocekivani odgovor. Obratite se administratoru.'),
    BadRequestPayload: () => message('Zahtev nije ispravno sastavljen. Obratite se administratoru.'),
  })
