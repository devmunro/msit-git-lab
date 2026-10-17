const path = require('path')
const fileURLToPath = require('url').fileURLToPath
const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu
const ipcMain = electron.ipcMain
const dialog = electron.dialog
const shell = electron.shell
const locale = require('./lib/locale.js')
let progressStore = null
let activeWindow = null
let activeLocale = 'en-US'

if (require('electron-squirrel-startup')) app.quit()

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.whenReady().then(function () {
  app.setName('MSIT Git Lab')
  if (process.platform === 'win32') app.setAppUserModelId('de.masterschool.msitgitlab')
  const userDataPath = path.join(app.getPath('userData'), 'user-data.json')
  progressStore = require('./lib/progress-store.js')(userDataPath)
  registerHandlers()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

function createWindow () {
  const language = locale.getFallbackLocale()
  activeLocale = language
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, 'assets', 'masterschool-app-icon.ico')
    : path.join(__dirname, 'assets', 'masterschool-app-icon.png')

  activeWindow = new BrowserWindow({
    minWidth: 800,
    minHeight: 620,
    width: 1180,
    height: 820,
    title: 'MSIT Git Lab',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })

  activeWindow.webContents.setWindowOpenHandler(function (details) {
    openExternal(details.url)
    return { action: 'deny' }
  })
  activeWindow.webContents.on('will-navigate', function (event, target) {
    if (!isAppPage(target)) event.preventDefault()
  })

  const entry = getResumeEntry(language)
  activeWindow.loadFile(entry.file, entry.options)
  Menu.setApplicationMenu(Menu.buildFromTemplate(
    process.platform === 'darwin'
      ? require('./menus/darwin-menu.js')(app, activeWindow)
      : require('./menus/other-menu.js')(app, activeWindow)
  ))

  activeWindow.on('closed', function () { activeWindow = null })
}

function getResumeEntry (language) {
  const localePath = locale.getLocaleBuiltPath(language)
  return { file: path.join(localePath, 'pages', 'index.html') }
}

function assertTrustedFrame (event) {
  const frameUrl = event.senderFrame && event.senderFrame.url
  if (!frameUrl || event.senderFrame !== event.sender.mainFrame || !isAppPage(frameUrl)) {
    throw new Error('This request did not come from the MSIT Git Lab window.')
  }
}

function isAppPage (target) {
  try {
    const destination = fileURLToPath(target)
    const appRoot = path.join(__dirname, 'built')
    const relative = path.relative(appRoot, destination)
    return !path.isAbsolute(relative) && relative !== '..' && relative.indexOf('..' + path.sep) !== 0
  } catch (error) {
    return false
  }
}

function handle (channel, handler) {
  ipcMain.handle(channel, async function (event) {
    assertTrustedFrame(event)
    return handler.apply(null, Array.prototype.slice.call(arguments, 1))
  })
}

function registerHandlers () {
  handle('git:diagnose', function () {
    return require('./lib/git-service.js').diagnose()
  })
  handle('repository:select', async function () {
    const result = await dialog.showOpenDialog(activeWindow, {
      properties: ['openDirectory'],
      title: activeLocale === 'de-DE' ? 'Git-Repository auswählen' : 'Choose a Git repository'
    })
    if (result.canceled || result.filePaths.length === 0) return { canceled: true }
    progressStore.setRepository(result.filePaths[0])
    return { canceled: false, path: result.filePaths[0] }
  })
  handle('progress:get', function () { return progressStore.get() })
  handle('progress:set', function (lessonId, completed) {
    return progressStore.setCompleted(lessonId, completed)
  })
  handle('progress:clear', async function () {
    const result = await dialog.showMessageBox(activeWindow, {
      type: 'question',
      buttons: activeLocale === 'de-DE' ? ['Fortschritt löschen', 'Abbrechen'] : ['Clear progress', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
      title: activeLocale === 'de-DE' ? 'Fortschritt löschen' : 'Clear progress',
      message: activeLocale === 'de-DE' ? 'Möchtest du deinen ganzen Lernfortschritt löschen?' : 'Clear all lesson progress?'
    })
    if (result.response !== 0) return false
    progressStore.clear()
    return true
  })
  handle('lesson:verify', async function (lessonId, repositoryPath) {
    const repository = repositoryPath || progressStore.get().savedRepository
    const result = await require('./lib/legacy-verification.js').verify(lessonId, repository)
    if (result.completed) progressStore.setCompleted(lessonId, true)
    return result
  })
  handle('lab:create', async function (labId) {
    const result = await require('./lib/labs.js').create(labId, app.getPath('documents'))
    progressStore.setCurrentLab(labId, result.path, !result.reused)
    return result
  })
  handle('lab:reset', async function (labId) {
    const result = await require('./lib/labs.js').reset(labId, app.getPath('documents'))
    progressStore.setCurrentLab(labId, result.path, !result.reused)
    return result
  })
  handle('lab:verify', async function (labId, repositoryPath) {
    const saved = progressStore.get().labs[labId]
    const targetPath = repositoryPath || (saved && saved.path)
    if (labId === 'reset-reflog' && targetPath && path.resolve(targetPath) !== path.resolve(require('./lib/labs.js').labPath(app.getPath('documents'), labId))) {
      return { completed: false, message: 'History recovery can only be checked in its generated practice lab.' }
    }
    const result = await require('./lib/labs.js').verify(labId, targetPath)
    if (result.completed) progressStore.setCompleted(labId, true)
    return result
  })
  handle('external:open', function (url) { return openExternal(url) })
  handle('clipboard:write', function (value) {
    if (typeof value !== 'string' || value.length > 2000) return false
    electron.clipboard.writeText(value)
    return true
  })
}

function openExternal (url) {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    shell.openExternal(parsed.toString())
    return true
  } catch (error) {
    return false
  }
}
