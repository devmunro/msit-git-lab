const childProcess = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

if (process.platform !== 'darwin') {
  console.log('Skipping macOS icon generation on ' + process.platform + '.')
  process.exit(0)
}

const projectRoot = path.join(__dirname, '..')
const sourcePath = path.join(projectRoot, 'assets', 'masterschool-app-icon.png')
const outputPath = path.join(projectRoot, 'assets', 'masterschool-app-icon.icns')
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'msit-git-lab-icons-'))
const iconsetPath = path.join(temporaryRoot, 'masterschool-app-icon.iconset')
const icons = [
  ['icon_16x16.png', 16],
  ['icon_16x16@2x.png', 32],
  ['icon_32x32.png', 32],
  ['icon_32x32@2x.png', 64],
  ['icon_128x128.png', 128],
  ['icon_128x128@2x.png', 256],
  ['icon_256x256.png', 256],
  ['icon_256x256@2x.png', 512],
  ['icon_512x512.png', 512],
  ['icon_512x512@2x.png', 1024]
]

function run (command, args) {
  const result = childProcess.spawnSync(command, args, { stdio: 'inherit', windowsHide: true })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(command + ' failed while preparing the macOS app icon.')
}

try {
  if (!fs.existsSync(sourcePath)) throw new Error('The Masterschool app icon PNG is missing: ' + sourcePath)
  fs.mkdirSync(iconsetPath)
  icons.forEach(function (icon) {
    const output = path.join(iconsetPath, icon[0])
    run('sips', ['-z', String(icon[1]), String(icon[1]), sourcePath, '--out', output])
  })
  run('iconutil', ['-c', 'icns', iconsetPath, '-o', outputPath])
  console.log('Generated ' + outputPath)
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true })
}
