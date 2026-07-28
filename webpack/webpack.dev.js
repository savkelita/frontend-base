const webpack = require('webpack')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')

// Backend target. Defaults to dummyjson (the demo backend); override with APIHOST/APIPORT.
const apiUrl = process.env.APIHOST
  ? `https://${process.env.APIHOST}:${process.env.APIPORT || 8080}`
  : 'https://dummyjson.com'

console.log('\x1b[34m%s\x1b[0m', `Using API on: ${apiUrl}`)

// -------------------------------------------------------------------------------------
// Dev-only combo mocks
// -------------------------------------------------------------------------------------
//
// dummyjson has no `pretrazi*Combo` routes, so the app's combos (which use the real
// pretraga contract) would 404 in dev. This middleware answers those exact routes with
// data in PretragaResponse shape — WITHOUT touching the app's routes/types. On a real
// pretraga backend, drop these mocks; the same requests hit the server for real.

// Grupa/Podgrupa carry `sifra` -> combo shows `sifra - naziv`. Grupe intentionally has >10
// rows so, with the combo's `limit_ = 10`, you can see the "showing 10 of N" behavior.
const GRUPE = [
  { id: 1, sifra: 'G001', naziv: 'Elektronika' },
  { id: 2, sifra: 'G002', naziv: 'Nameštaj' },
  { id: 3, sifra: 'G003', naziv: 'Hrana' },
  { id: 4, sifra: 'G004', naziv: 'Odeća' },
  { id: 5, sifra: 'G005', naziv: 'Obuća' },
  { id: 6, sifra: 'G006', naziv: 'Igračke' },
  { id: 7, sifra: 'G007', naziv: 'Alati' },
  { id: 8, sifra: 'G008', naziv: 'Kancelarija' },
  { id: 9, sifra: 'G009', naziv: 'Sport' },
  { id: 10, sifra: 'G010', naziv: 'Bašta' },
  { id: 11, sifra: 'G011', naziv: 'Kućni aparati' },
  { id: 12, sifra: 'G012', naziv: 'Kozmetika' },
  { id: 13, sifra: 'G013', naziv: 'Knjige' },
  { id: 14, sifra: 'G014', naziv: 'Auto oprema' },
  { id: 15, sifra: 'G015', naziv: 'Muzika' },
]

const PODGRUPE = {
  1: [
    { id: 11, sifra: 'P011', naziv: 'Telefoni' },
    { id: 12, sifra: 'P012', naziv: 'Laptopovi' },
    { id: 13, sifra: 'P013', naziv: 'Televizori' },
  ],
  2: [
    { id: 21, sifra: 'P021', naziv: 'Stolice' },
    { id: 22, sifra: 'P022', naziv: 'Stolovi' },
  ],
  3: [
    { id: 31, sifra: 'P031', naziv: 'Voće' },
    { id: 32, sifra: 'P032', naziv: 'Povrće' },
  ],
}

// Proizvod has no `sifra` -> combo shows just `naziv`.
const PROIZVODI = [
  { id: 101, naziv: 'Proizvod A' },
  { id: 102, naziv: 'Proizvod B' },
  { id: 103, naziv: 'Proizvod C' },
]

const comboMock = (req, res, next) => {
  const url = new URL(req.url, 'http://localhost')
  const path = url.pathname
  if (!path.startsWith('/api/products/pretrazi')) return next()

  // criteria: unetaVrednost=contains&unetaVrednost=<text>
  const text = (url.searchParams.getAll('unetaVrednost')[1] || '').toLowerCase()

  let rows = []
  if (path.endsWith('pretraziGrupaCombo')) rows = GRUPE
  else if (path.endsWith('pretraziPodgrupaCombo')) rows = PODGRUPE[Number(url.searchParams.get('grupaID'))] || []
  else if (path.endsWith('pretraziProizvodCombo')) rows = PROIZVODI

  const matched = rows.filter(r => r.naziv.toLowerCase().includes(text))
  // Page by limit_/offset_ (offset_ is a row offset: 0, 10, 20, …). total_ is the full count,
  // so the combo knows there are more pages to "load more".
  const limit = Number(url.searchParams.get('limit_')) || matched.length
  const offset = Number(url.searchParams.get('offset_')) || 0
  const result = matched.slice(offset, offset + limit)
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ total_: matched.length, offset_: offset, result }))
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
      // Runs before the proxy, so the combo routes are served locally.
      middlewares.unshift({ name: 'combo-mock', middleware: comboMock })
      return middlewares
    },
    proxy: [
      {
        // /api/* requests are forwarded to the backend
        // pathRewrite strips /api prefix - remove this if your backend routes include /api
        context: ['/api'],
        target: apiUrl,
        secure: false,
        changeOrigin: true,
        pathRewrite: { '^/api': '' },
      },
    ],
  },
  plugins: [
    new ReactRefreshWebpackPlugin(),
    new webpack.DefinePlugin({
      'process.env.basename': JSON.stringify('/'),
      'process.env.apiBaseUrl': JSON.stringify('/api'),
    }),
  ],
}
