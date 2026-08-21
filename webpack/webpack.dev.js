const webpack = require('webpack')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')

const apiHost = process.env.APIHOST || '192.168.36.234'
const apiPort = process.env.APIPORT || 8080
const apiUrl = `http://${apiHost}:${apiPort}`

console.log('\x1b[34m%s\x1b[0m', `Using API on: ${apiUrl}`)

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
    proxy: [
      {
        // Backend routes already include /api, so the prefix is forwarded as-is.
        context: ['/api'],
        target: apiUrl,
        secure: false,
        changeOrigin: true,
      },
    ],
  },
  plugins: [
    new ReactRefreshWebpackPlugin(),
    new webpack.DefinePlugin({
      'process.env.basename': JSON.stringify('/'),
      // Prazno da zahtevi idu na origin dev servera i kroz proxy iznad: sesija je
      // kolacic, pa mora da ostane isti origin — inace trazi CORS i SameSite=None.
      'process.env.apiBaseUrl': JSON.stringify(''),
    }),
  ],
}
