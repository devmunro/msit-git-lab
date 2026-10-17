const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')
const packageData = require('../package.json')

if (process.platform !== 'darwin') {
  console.log('Skipping DMG creation on ' + process.platform + '.')
  process.exit(0)
}

const outputRoot = path.join(__dirname, '..', 'out')
const packageFolders = fs.readdirSync(outputRoot, { withFileTypes: true }).filter(function (entry) {
  return entry.isDirectory() && entry.name.indexOf('darwin') !== -1
}).map(function (entry) { return path.join(outputRoot, entry.name) })
let appPath = null

packageFolders.some(function (folder) {
  const appName = fs.readdirSync(folder).find(function (entry) { return entry.endsWith('.app') })
  if (!appName) return false
  appPath = path.join(folder, appName)
  return true
})

if (!appPath) throw new Error('Could not find the packaged macOS application under out/.')

const makeRoot = path.join(outputRoot, 'make')
const stagingPath = path.join(makeRoot, 'dmg-staging')
const outputFolder = path.join(makeRoot, 'dmg')
const dmgName = 'MSIT-Git-Lab-' + packageData.version + '.dmg'
const dmgPath = path.join(outputFolder, dmgName)
fs.mkdirSync(makeRoot, { recursive: true })
fs.rmSync(stagingPath, { recursive: true, force: true })
fs.mkdirSync(stagingPath, { recursive: true })
fs.mkdirSync(outputFolder, { recursive: true })
fs.cpSync(appPath, path.join(stagingPath, path.basename(appPath)), { recursive: true })
fs.symlinkSync('/Applications', path.join(stagingPath, 'Applications'), 'dir')

const result = childProcess.spawnSync('hdiutil', [
  'create', '-srcfolder', stagingPath, '-volname', 'MSIT Git Lab', '-ov', '-format', 'UDZO', dmgPath
], { stdio: 'inherit', windowsHide: true })
fs.rmSync(stagingPath, { recursive: true, force: true })
if (result.error) throw result.error
if (result.status !== 0) throw new Error('hdiutil could not create the macOS disk image.')
console.log('Created ' + dmgPath)
