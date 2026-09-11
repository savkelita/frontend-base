const fs = require('fs')
const path = require('path')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')

// Backend target. Defaults to dummyjson (the demo backend); override with APIHOST/APIPORT.
const apiUrl = process.env.APIHOST
  ? `https://${process.env.APIHOST}:${process.env.APIPORT || 8080}`
  : 'https://dummyjson.com'

console.log('\x1b[34m%s\x1b[0m', `Using API on: ${apiUrl}`)

// -------------------------------------------------------------------------------------
// Dev mock — rute stavke otpremnice
// -------------------------------------------------------------------------------------
//
// Iza dev proxy-ja nema pravog backenda za ove rute, pa ih ovaj middleware odgovara u
// obliku Java pretrage ({ total_, offset_, result }). Rute i imena su ista kao na Magacinu,
// pa se aplikacija ne dira. Kad se prikljuci pravi backend, middleware se izbacuje.

const ARTIKLI = [
  {
    id: 100,
    sifra: 'ART-1',
    naziv: 'Mleko 1l',
    skraceniNaziv: 'Mleko',
    kolicinaUJediniciMere: 1,
    koeficijentKonverzije: 1,
    eanKod: '8600001',
    podgrupaArtiklaID: 1,
  },
  {
    id: 101,
    sifra: 'ART-2',
    naziv: 'Hleb beli 500g',
    skraceniNaziv: 'Hleb',
    kolicinaUJediniciMere: 1,
    koeficijentKonverzije: 1,
    eanKod: '8600002',
    podgrupaArtiklaID: 1,
  },
  {
    id: 102,
    sifra: 'ART-3',
    naziv: 'Kafa mlevena 200g',
    skraceniNaziv: 'Kafa',
    kolicinaUJediniciMere: 1,
    koeficijentKonverzije: 1,
    eanKod: null,
    podgrupaArtiklaID: 2,
  },
  {
    id: 103,
    sifra: 'ART-4',
    naziv: 'Ulje suncokretovo 1l',
    skraceniNaziv: 'Ulje',
    kolicinaUJediniciMere: 1,
    koeficijentKonverzije: 1,
    eanKod: '8600004',
    podgrupaArtiklaID: 2,
  },
  {
    id: 104,
    sifra: 'ART-5',
    naziv: 'Secer kristal 1kg',
    skraceniNaziv: 'Secer',
    kolicinaUJediniciMere: 1,
    koeficijentKonverzije: 1,
    eanKod: null,
    podgrupaArtiklaID: 2,
  },
]

const pakovanje = (id, artikal, naziv, uPakovanju, uOsnovnoj) => ({
  id,
  artikalID: artikal.id,
  artikalSifra: artikal.sifra,
  artikalNaziv: artikal.naziv,
  artikalBarKod: artikal.eanKod,
  osnovniArtikal: true,
  jedinicaMereSifra: 'KOM',
  jedinicaMereOznaka: 'kom',
  osnovnaJedinicaMereSifra: 'KOM',
  osnovnaJedinicaMereOznaka: 'kom',
  osnovnaJedinicaMereNaziv: 'Komad',
  pakovanjeNaziv: naziv,
  barKod: null,
  kolicinaUPakovanju: uPakovanju,
  kolicinaUOsnovnojJM: uOsnovnoj,
  pakovanjeDimenzijaSifra: 'PD-' + id,
  pakovanjeDimenzijaNaziv: naziv,
  sirina: 20,
  duzina: 30,
  visina: 15,
  jedinicaMereZaDuzinuSifra: 'CM',
  jedinicaMereZaDuzinuOznaka: 'cm',
  jedinicaMereZaDuzinuNaziv: 'Centimetar',
  brutoTezina: 5,
  jedinicaMereZaTezinuSifra: 'KG',
  jedinicaMereZaTezinuOznaka: 'kg',
  jedinicaMereZaTezinuNaziv: 'Kilogram',
})

const PAKOVANJA = [
  pakovanje(500, ARTIKLI[0], 'Gajba 12/1', 12, 1),
  pakovanje(501, ARTIKLI[0], 'Paleta 480/1', 480, 1),
  pakovanje(502, ARTIKLI[1], 'Korpa 20/1', 20, 1),
  pakovanje(503, ARTIKLI[2], 'Kutija 24/1', 24, 1),
  pakovanje(504, ARTIKLI[3], 'Gajba 6/1', 6, 1),
  pakovanje(505, ARTIKLI[4], 'Dzak 25/1', 25, 1),
]

// Magacin 1 ne poznaje pakovanje 501 — tako se u dev-u vidi dijalog za potvrdu.
const NEPOZNATA_PAKOVANJA = new Set([501])

const STAVKE_PORUDZBENICE = [
  {
    id: 900,
    redniBroj: 1,
    artikalID: 100,
    artikalPakovanjeID: 500,
    artikalSifra: 'ART-1',
    artikalNaziv: 'Mleko 1l',
    artikalPakovanjeNaziv: 'Gajba 12/1',
    porucenaKolicina: 10,
    porucenaOsnovnaKolicina: 120,
    osnovnaJedinicaMereOznaka: 'kom',
  },
  {
    id: 901,
    redniBroj: 2,
    artikalID: 102,
    artikalPakovanjeID: 503,
    artikalSifra: 'ART-3',
    artikalNaziv: 'Kafa mlevena 200g',
    artikalPakovanjeNaziv: 'Kutija 24/1',
    porucenaKolicina: 4,
    porucenaOsnovnaKolicina: 96,
    osnovnaJedinicaMereOznaka: 'kom',
  },
]

const posalji = (res, telo) => {
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(telo))
}

// Тело POST захтева; команде пилот модула мењају стање, па морају да га прочитају.
const procitajTelo = (req, f) => {
  let sirovo = ''
  req.on('data', deo => (sirovo += deo))
  req.on('end', () => f(sirovo === '' ? {} : JSON.parse(sirovo)))
}

// Java pretraga: limit_ / offset_ su redovni pomeraji, total_ je pun broj pogodaka.
const pretraga = (res, url, redovi) => {
  const limit = Number(url.searchParams.get('limit_')) || redovi.length
  const offset = Number(url.searchParams.get('offset_')) || 0
  posalji(res, { total_: redovi.length, offset_: offset, result: redovi.slice(offset, offset + limit) })
}

// unetaVrednost=contains&unetaVrednost=<tekst>
const uneti = url => (url.searchParams.getAll('unetaVrednost')[1] || '').toLowerCase()

// Ставке отпремнице — довољно редова да се види страничење.
const STAVKE = Array.from({ length: 23 }, (_, i) => {
  const artikal = ARTIKLI[i % ARTIKLI.length]
  const pak = PAKOVANJA[i % PAKOVANJA.length]
  return {
    id: 700 + i,
    version: 0,
    redniBroj: i + 1,
    artikalSifra: artikal.sifra,
    artikalNaziv: artikal.naziv,
    pakovanjeNaziv: pak.pakovanjeDimenzijaNaziv,
    kolicina: (i % 7) + 1,
    osnovnaKolicina: ((i % 7) + 1) * pak.kolicinaUPakovanju,
    osnovnaJedinicaMereOznaka: 'kom',
  }
})

// Пилот модул: артикли као шифарник. Стање се мења у меморији, да се у dev-у виде и
// креирање и измена и брисање.
const JEDINICE_MERE = [
  { id: 10, sifra: 'KOM', naziv: 'Komad', oznaka: 'kom' },
  { id: 11, sifra: 'KG', naziv: 'Kilogram', oznaka: 'kg' },
  { id: 12, sifra: 'L', naziv: 'Litar', oznaka: 'l' },
]

const GRUPE_ARTIKALA = [
  { id: 20, sifra: 'GR-1', naziv: 'Mlecni proizvodi' },
  { id: 21, sifra: 'GR-2', naziv: 'Pekarski proizvodi' },
  { id: 22, sifra: 'GR-3', naziv: 'Kolonijalna roba' },
]

const artikalRed = i => {
  const jm = JEDINICE_MERE[i % JEDINICE_MERE.length]
  const grupa = GRUPE_ARTIKALA[i % GRUPE_ARTIKALA.length]
  return {
    id: 1000 + i,
    version: 0,
    sifra: 'ART-' + String(i + 1).padStart(3, '0'),
    naziv: 'Artikal broj ' + (i + 1),
    skraceniNaziv: 'ART' + (i + 1),
    jedinicaMereID: jm.id,
    jedinicaMereOznaka: jm.oznaka,
    grupaArtiklaID: grupa.id,
    grupaArtiklaNaziv: grupa.naziv,
    kolicinaUJediniciMere: 1,
    stanje: i % 5 === 0 ? 'U_PRIPREMI' : i % 7 === 0 ? 'NEAKTIVAN' : 'AKTIVAN',
  }
}

const SIFARNIK_ARTIKALA = Array.from({ length: 37 }, (_, i) => artikalRed(i))

const ARTIKAL_PAKOVANJA = SIFARNIK_ARTIKALA.flatMap((a, i) =>
  Array.from({ length: (i % 3) + 1 }, (_, j) => ({
    id: 5000 + i * 10 + j,
    version: 0,
    artikalID: a.id,
    pakovanjeNaziv: ['Komad', 'Kutija 10/1', 'Paleta 100/1'][j],
    kolicina: [1, 10, 100][j],
    jedinicaMereOznaka: a.jedinicaMereOznaka,
  })),
)

// Предикат стиже као поновљен кључ: kolicina=between&kolicina=5~10. Празан низ значи да
// критеријум није ни послат.
const primeniPredikat = (redovi, polje, delovi) => {
  if (delovi.length < 2) return redovi
  const [operator, vrednost] = delovi
  if (operator === 'between') {
    const [od, do_] = vrednost.split('~').map(Number)
    return redovi.filter(r => r[polje] >= od && r[polje] <= do_)
  }
  const broj = Number(vrednost)
  const testovi = {
    eq: v => v === broj,
    neq: v => v !== broj,
    lt: v => v < broj,
    lte: v => v <= broj,
    gt: v => v > broj,
    gte: v => v >= broj,
    contains: v => String(v).toLowerCase().includes(vrednost.toLowerCase()),
    starts_with: v => String(v).toLowerCase().startsWith(vrednost.toLowerCase()),
  }
  const test = testovi[operator]
  return test ? redovi.filter(r => test(r[polje])) : redovi
}

const uporedi = (a, b, kolona, smer) => {
  const x = a[kolona]
  const y = b[kolona]
  const znak = x === y ? 0 : x < y ? -1 : 1
  return smer === 'DESC' ? -znak : znak
}

// Изнад опсега који заузима шифарник артикала (1000…1036).
let sledeciID = 9000

// Сесија у дев-у: колачић се поставља при пријави, траје кратко да се види дијалог за
// продужавање, а `tekucaSesija` враћа 401 док пријаве нема.
const TRAJANJE_SESIJE_SEK = 150
let sesijaDo = 0

const sesijaOdgovor = () => ({
  korisnickoIme: 'demo',
  authorizations: [
    { name: 'home.view' },
    { name: 'otpremnice.view' },
    { name: 'artikal.view' },
    { name: 'artikal.kreiranje' },
    { name: 'artikal.azuriranje' },
    { name: 'artikal.brisanje' },
  ],
  istekZaSekundi: Math.max(0, Math.round((sesijaDo - Date.now()) / 1000)),
})

const devMock = (req, res, next) => {
  const url = new URL(req.url, 'http://localhost')
  const put = url.pathname
  if (!put.startsWith('/api/')) return next()

  if (put === '/api/autentifikacija/prijava' && req.method === 'POST') {
    sesijaDo = Date.now() + TRAJANJE_SESIJE_SEK * 1000
    res.setHeader('Set-Cookie', 'XSRF-TOKEN=dev-token; Path=/; SameSite=Lax')
    return posalji(res, sesijaOdgovor())
  }

  if (put === '/api/autentifikacija/tekucaSesija' && req.method === 'POST') {
    if (Date.now() >= sesijaDo) {
      res.statusCode = 401
      return res.end('[]')
    }
    return posalji(res, sesijaOdgovor())
  }

  if (put === '/api/autentifikacija/produziSesiju' && req.method === 'POST') {
    sesijaDo = Date.now() + TRAJANJE_SESIJE_SEK * 1000
    return posalji(res, sesijaOdgovor())
  }

  if (put === '/api/autentifikacija/odjava' && req.method === 'POST') {
    sesijaDo = 0
    return posalji(res, {})
  }

  // Иста рута као у продукцији; садржај долази из public/config.dev.json.
  if (put === '/config.json') {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    return res.end(fs.readFileSync(path.resolve(__dirname, '..', 'public/config.dev.json'), 'utf8'))
  }

  if (put === '/api/sifarnik/pretraziArtikalCombo') {
    const t = uneti(url)
    return pretraga(
      res,
      url,
      ARTIKLI.filter(a => (a.sifra + ' ' + a.naziv).toLowerCase().includes(t)),
    )
  }

  if (put === '/api/otpremnica/pretraziArtikalPakovanjeOtpremnicaCombo') {
    const t = uneti(url)
    const id = url.searchParams.get('id')
    const artikalID = url.searchParams.get('artikalID')
    let redovi = PAKOVANJA
    if (id) redovi = redovi.filter(p => String(p.id) === id)
    if (artikalID) redovi = redovi.filter(p => String(p.artikalID) === artikalID)
    return pretraga(
      res,
      url,
      redovi.filter(p => p.pakovanjeDimenzijaNaziv.toLowerCase().includes(t)),
    )
  }

  if (put === '/api/otpremnica/pretraziStavkaOtpremnice') {
    let redovi = [...STAVKE]
    // order_ стиже као поновљен параметар: колона, смер, колона, смер…
    const order = url.searchParams.getAll('order_')
    for (let i = order.length - 2; i >= 0; i -= 2) {
      const kolona = order[i]
      const smer = order[i + 1]
      redovi.sort((a, b) => uporedi(a, b, kolona, smer))
    }
    for (const polje of ['redniBroj', 'kolicina']) {
      redovi = primeniPredikat(redovi, polje, url.searchParams.getAll(polje))
    }
    return pretraga(res, url, redovi)
  }

  if (put === '/api/otpremnica/pretraziStavkaPorudzbeniceOtpremnicaCombo') {
    const t = uneti(url)
    return pretraga(
      res,
      url,
      STAVKE_PORUDZBENICE.filter(s => (s.artikalSifra + ' ' + s.artikalNaziv).toLowerCase().includes(t)),
    )
  }

  if (put.startsWith('/api/otpremnica/dajSledeciRedniBrojStavkeOtpremnice/')) {
    return posalji(res, 4)
  }

  if (put === '/api/sifarnik/proveriMagacinArtikalPakovanje') {
    const pakID = Number(url.searchParams.get('artikalPakovanjeID'))
    return posalji(res, { postoji: !NEPOZNATA_PAKOVANJA.has(pakID) })
  }

  // --- пилот модул: артикли ---

  if (put === '/api/sifarnik/pretraziArtikal') {
    let redovi = [...SIFARNIK_ARTIKALA]
    for (const polje of ['sifra', 'naziv']) {
      redovi = primeniPredikat(redovi, polje, url.searchParams.getAll(polje))
    }
    const stanje = url.searchParams.get('stanje')
    if (stanje) redovi = redovi.filter(a => a.stanje === stanje)
    const order = url.searchParams.getAll('order_')
    for (let i = order.length - 2; i >= 0; i -= 2) {
      redovi.sort((a, b) => uporedi(a, b, order[i], order[i + 1]))
    }
    return pretraga(res, url, redovi)
  }

  if (put.startsWith('/api/sifarnik/dajArtikal/')) {
    const id = Number(put.split('/').pop())
    const artikal = SIFARNIK_ARTIKALA.find(a => a.id === id)
    if (!artikal) {
      res.statusCode = 404
      return res.end('{}')
    }
    return posalji(res, artikal)
  }

  if (put === '/api/sifarnik/pretraziArtikalPakovanje') {
    const artikalID = Number(url.searchParams.get('artikalID'))
    return posalji(res, {
      total_: ARTIKAL_PAKOVANJA.filter(p => p.artikalID === artikalID).length,
      offset_: 0,
      result: ARTIKAL_PAKOVANJA.filter(p => p.artikalID === artikalID),
    })
  }

  if (put === '/api/sifarnik/pretraziJedinicaMereCombo') {
    const tekst = uneti(url)
    return pretraga(
      res,
      url,
      JEDINICE_MERE.filter(j => (j.sifra + ' ' + j.naziv).toLowerCase().includes(tekst)),
    )
  }

  if (put === '/api/sifarnik/pretraziGrupaArtiklaCombo') {
    const tekst = uneti(url)
    return pretraga(
      res,
      url,
      GRUPE_ARTIKALA.filter(g => (g.sifra + ' ' + g.naziv).toLowerCase().includes(tekst)),
    )
  }

  if (put === '/api/sifarnik/kreirajArtikal' && req.method === 'POST') {
    return procitajTelo(req, cmd => {
      if (SIFARNIK_ARTIKALA.some(a => a.sifra === cmd.sifra)) {
        res.statusCode = 400
        return res.end(
          JSON.stringify([
            {
              type: 'BUSINESS',
              code: 'ARTIKAL_SIFRA_POSTOJI',
              severity: 'ERROR',
              message: 'Артикал са овом шифром већ постоји.',
            },
          ]),
        )
      }
      const jm = JEDINICE_MERE.find(j => j.id === cmd.jedinicaMereID) || JEDINICE_MERE[0]
      const grupa = GRUPE_ARTIKALA.find(g => g.id === cmd.grupaArtiklaID) || GRUPE_ARTIKALA[0]
      const noviID = sledeciID++
      SIFARNIK_ARTIKALA.unshift({
        ...cmd,
        id: noviID,
        version: 0,
        jedinicaMereOznaka: jm.oznaka,
        grupaArtiklaNaziv: grupa.naziv,
        stanje: 'U_PRIPREMI',
      })
      return posalji(res, { id: noviID, version: 0 })
    })
  }

  if (put === '/api/sifarnik/azurirajArtikal' && req.method === 'POST') {
    return procitajTelo(req, cmd => {
      const i = SIFARNIK_ARTIKALA.findIndex(a => a.id === cmd.id)
      if (i === -1) {
        res.statusCode = 404
        return res.end('{}')
      }
      const jm = JEDINICE_MERE.find(j => j.id === cmd.jedinicaMereID) || JEDINICE_MERE[0]
      const grupa = GRUPE_ARTIKALA.find(g => g.id === cmd.grupaArtiklaID) || GRUPE_ARTIKALA[0]
      SIFARNIK_ARTIKALA[i] = {
        ...SIFARNIK_ARTIKALA[i],
        ...cmd,
        version: SIFARNIK_ARTIKALA[i].version + 1,
        jedinicaMereOznaka: jm.oznaka,
        grupaArtiklaNaziv: grupa.naziv,
      }
      return posalji(res, {})
    })
  }

  if (put === '/api/sifarnik/obrisiArtikal' && req.method === 'POST') {
    return procitajTelo(req, cmd => {
      const i = SIFARNIK_ARTIKALA.findIndex(a => a.id === cmd.id)
      if (i !== -1) SIFARNIK_ARTIKALA.splice(i, 1)
      return posalji(res, {})
    })
  }

  if (put === '/api/otpremnica/kreirajStavkaOtpremnice' && req.method === 'POST') {
    return posalji(res, { id: sledeciID++, version: 0 })
  }

  return next()
}

module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    server: 'https',
    hot: true,
    open: false,
    port: 3000,
    historyApiFallback: true,
    client: {
      overlay: { errors: true, warnings: false },
    },
    setupMiddlewares: middlewares => {
      // Ide pre proxy-ja, pa se rute odgovaraju lokalno.
      middlewares.unshift({ name: 'dev-mock', middleware: devMock })
      return middlewares
    },
    proxy: [
      {
        // Rute već sadrže /api (kao na backendu), pa se putanja prosleđuje netaknuta.
        context: ['/api'],
        target: apiUrl,
        secure: false,
        changeOrigin: true,
      },
    ],
  },
  plugins: [new ReactRefreshWebpackPlugin()],
}
