const fs = require('fs')
const path = require('path')

const packagePath = path.join(__dirname, '..', 'package.json')
const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
const runNumber = process.env.GITHUB_RUN_NUMBER || process.env.BUILD_NUMBER
const shortSha = (process.env.GITHUB_SHA || 'local').slice(0, 7)
const requestedVersion = process.argv[2]
const version = requestedVersion || (runNumber && packageData.version.split('-')[0] + '-dev.' + runNumber)

if (!version || !/^\d+\.\d+\.\d+-dev\.\d+$/.test(version)) {
  throw new Error('Pass a version such as 5.0.0-dev.42 or set GITHUB_RUN_NUMBER to create a unique development version.')
}

packageData.version = version
fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2) + '\n')
console.log('Development version: ' + packageData.version + ' (' + shortSha + ')')
