// Ниједан префикс не улази у грађевину: и basePath и apiUrl долазе из config.json при
// подизању, па исти артефакт стоји под било којим бројем инстанци.
module.exports = {
  mode: 'production',
  devtool: 'source-map',
}
