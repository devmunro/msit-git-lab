const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')

if (process.platform !== 'win32') {
  console.log('Skipping the Windows setup wrapper on ' + process.platform + '.')
  process.exit(0)
}

const outputDirectory = path.join(__dirname, '..', 'out', 'make', 'squirrel.windows', 'x64')
const setupFiles = fs.readdirSync(outputDirectory).filter(function (name) {
  return name.endsWith(' Setup.exe')
})
if (setupFiles.length !== 1) {
  throw new Error('Expected one Squirrel setup executable in ' + outputDirectory + ', found ' + setupFiles.length + '.')
}

const setupPath = path.join(outputDirectory, setupFiles[0])
const wrappedPath = setupPath + '.wrapped.exe'
const launcherPath = path.join(__dirname, 'windows-setup-launcher.cs')
const iconPath = path.join(__dirname, '..', 'assets', 'masterschool-app-icon.ico')
const compilerCandidates = [
  path.join(process.env.WINDIR || 'C:\\Windows', 'Microsoft.NET', 'Framework64', 'v4.0.30319', 'csc.exe'),
  path.join(process.env.WINDIR || 'C:\\Windows', 'Microsoft.NET', 'Framework', 'v4.0.30319', 'csc.exe')
]
const compilerPath = compilerCandidates.find(fs.existsSync)
if (!compilerPath) throw new Error('Could not find the .NET Framework C# compiler on this Windows runner.')

childProcess.execFileSync(compilerPath, [
  '/nologo',
  '/target:winexe',
  '/platform:x64',
  '/win32icon:' + iconPath,
  '/out:' + wrappedPath,
  '/resource:' + setupPath + ',MSITGitLab.SquirrelSetup',
  launcherPath
], { stdio: 'inherit', windowsHide: true })

const originalPath = setupPath + '.squirrel.exe'
fs.renameSync(setupPath, originalPath)
try {
  fs.renameSync(wrappedPath, setupPath)
  fs.unlinkSync(originalPath)
} catch (error) {
  if (fs.existsSync(originalPath) && !fs.existsSync(setupPath)) fs.renameSync(originalPath, setupPath)
  throw error
}

console.log('Wrapped Squirrel setup with a clean app-shutdown handoff: ' + setupPath)
