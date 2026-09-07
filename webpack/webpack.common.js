const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

// FluentUI packages that carry React context (theme, portal mount node, positioning,
// focus). The datepicker/timepicker-compat packages pull their own nested copies; if
// webpack bundles more than one, FluentProvider sets the theme on one context while the
// calendar/popup reads another (default, no theme) — so the calendar renders unstyled.
// Force a single physical copy of each so there is exactly one context instance.
const fluentSingletons = [
  '@fluentui/react-shared-contexts',
  '@fluentui/react-portal',
  '@fluentui/react-positioning',
  '@fluentui/react-tabster',
]

module.exports = {
  entry: path.resolve(__dirname, '..', './src/index.tsx'),
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: Object.fromEntries(
      fluentSingletons.map(pkg => [pkg, path.resolve(__dirname, '..', 'node_modules', pkg)]),
    ),
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
          },
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(?:ico|gif|png|jpg|jpeg)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff(2)?|eot|ttf|otf|svg)$/,
        type: 'asset/inline',
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, '..', './dist'),
    filename: 'scripts/bundle.[contenthash].js',
    clean: true,
    publicPath: '/',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '..', './src/index.html'),
    }),
  ],
  stats: 'errors-only',
}
