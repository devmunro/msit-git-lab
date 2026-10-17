const locale = require('../lib/locale.js')
module.exports = function menu (app, mainWindow) {
  const otherMenu = [
    {
      label: '&File',
      submenu: [
        // {
        //     label: '&Open',
        //     accelerator: 'Ctrl+O'
        // },
        {
          label: '&Quit',
          accelerator: 'Ctrl+Q',
          click: function () {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: function (item, focusedWindow) {
            focusedWindow.reload()
          }
        },
        {
          label: 'Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: function (item, focusedWindow) {
            focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
          }
        },
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:'
        },
        {
          type: 'separator'
        },
        {
          label: 'Bring All to Front',
          selector: 'arrangeInFront:'
        },
        {
          type: 'separator'
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: function (item, focusedWindow) {
            focusedWindow.webContents.toggleDevTools()
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Home',
          click: function (item, focusedWindow) {
            if (focusedWindow) {
              const path = require('path').join(locale.getLocaleBuiltPath(locale.getCurrentLocale(focusedWindow)), 'pages', 'index.html')
              focusedWindow.loadFile(path)
              // console.log(focusedWindow)
            }
          }
        },
        {
          label: 'Dictionary',
          click: function (item, focusedWindow) {
            if (focusedWindow) {
              const path = require('path').join(locale.getLocaleBuiltPath(locale.getCurrentLocale(focusedWindow)), 'pages', 'resources.html')
              focusedWindow.loadFile(path, { hash: 'git-dictionary' })
            }
          }
        },
        {
          label: 'Resources',
          click: function (item, focusedWindow) {
            if (focusedWindow) {
              const path = require('path').join(locale.getLocaleBuiltPath(locale.getCurrentLocale(focusedWindow)), 'pages', 'resources.html')
              focusedWindow.loadFile(path)
            }
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Repository',
          click: function () {
            require('electron').shell.openExternal('https://github.com/jlord/git-it-electron')
          }
        },
        {
          label: 'About App',
          click: function (item, focusedWindow) {
            if (focusedWindow) {
              const path = require('path').join(locale.getLocaleBuiltPath(locale.getCurrentLocale(focusedWindow)), 'pages', 'about.html')
              focusedWindow.loadURL(path)
            }
          }
        }
      ]
    }
  ]
  return otherMenu
}
