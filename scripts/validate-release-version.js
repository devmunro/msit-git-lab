const fs = require('fs')
const path = require('path')

const packageData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))
const releaseVersion = process.argv[2]
if (!/^\d+\.\d+\.\d+$/.test(releaseVersion || '')) {
  throw new Error('A stable release tag must use semantic versioning, for example 5.0.0.')
}
if (releaseVersion !== packageData.version) {
  throw new Error('Release tag v' + releaseVersion + ' must match package.json version ' + packageData.version + '.')
}
console.log('Validated stable release v' + releaseVersion)
