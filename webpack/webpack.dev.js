const webpack = require('webpack')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')

const apiHost = process.env.APIHOST || 'localhost'
const apiPort = process.env.APIPORT || 8080
const apiUrl = `https://${apiHost}:${apiPort}`

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
      'process.env.apiBaseUrl': JSON.stringify('https://dummyjson.com'),
    }),
  ],
}
