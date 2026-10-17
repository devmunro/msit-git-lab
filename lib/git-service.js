const childProcess = require('child_process')
const fs = require('fs')
const util = require('util')

const execFile = util.promisify(childProcess.execFile)

async function runGit (args, options) {
  const cwd = options && options.cwd
  if (cwd) {
    const stats = await fs.promises.stat(cwd)
    if (!stats.isDirectory()) throw new Error('The selected path is not a folder.')
  }
  const result = await execFile('git', args, {
    cwd,
    windowsHide: true,
    timeout: 20000,
    maxBuffer: 1024 * 1024,
    encoding: 'utf8'
  })
  return result.stdout.trim()
}

async function tryGit (args, cwd) {
  try {
    return { ok: true, output: await runGit(args, { cwd }) }
  } catch (error) {
    return { ok: false, output: String(error.stderr || error.stdout || error.message || '').trim() }
  }
}

async function diagnose () {
  const version = await tryGit(['--version'])
  const name = await tryGit(['config', '--global', '--get', 'user.name'])
  const email = await tryGit(['config', '--global', '--get', 'user.email'])
  const versionMatch = version.output.match(/git version (\d+)\.(\d+)\.(\d+)/)
  const parts = versionMatch ? versionMatch.slice(1).map(Number) : []
  const supported = parts.length === 3 && (parts[0] > 2 || (parts[0] === 2 && parts[1] >= 39))
  return {
    installed: version.ok,
    version: version.ok ? version.output : null,
    supported,
    userNameConfigured: name.ok && Boolean(name.output),
    userEmailConfigured: email.ok && Boolean(email.output),
    platform: process.platform
  }
}

module.exports = { runGit, tryGit, diagnose }
