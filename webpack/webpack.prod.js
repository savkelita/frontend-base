const webpack = require('webpack')
const build = require('./build')

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env.basename': JSON.stringify('/'),
      'process.env.apiBaseUrl': JSON.stringify(''),
      'process.env.build': JSON.stringify(build),
    }),
  ],
}
