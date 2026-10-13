const { execSync } = require('child_process')
const { version } = require('../package.json')

const commit = () => {
  try {
    return execSync('git describe --always --dirty', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return 'nepoznat'
  }
}

module.exports = `${version}+${commit()}`
