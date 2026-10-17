const electron = require('electron')
const contextBridge = electron.contextBridge
const ipcRenderer = electron.ipcRenderer

contextBridge.exposeInMainWorld('msitGitLab', {
  diagnoseGit: function () { return ipcRenderer.invoke('git:diagnose') },
  selectRepository: function () { return ipcRenderer.invoke('repository:select') },
  getProgress: function () { return ipcRenderer.invoke('progress:get') },
  setProgress: function (lessonId, completed) {
    return ipcRenderer.invoke('progress:set', lessonId, Boolean(completed))
  },
  clearProgress: function () { return ipcRenderer.invoke('progress:clear') },
  verifyLesson: function (lessonId, repositoryPath) {
    return ipcRenderer.invoke('lesson:verify', lessonId, repositoryPath || null)
  },
  createLab: function (labId) { return ipcRenderer.invoke('lab:create', labId) },
  resetLab: function (labId) { return ipcRenderer.invoke('lab:reset', labId) },
  verifyLab: function (labId, repositoryPath) {
    return ipcRenderer.invoke('lab:verify', labId, repositoryPath || null)
  },
  openExternal: function (url) { return ipcRenderer.invoke('external:open', url) },
  copyText: function (value) { return ipcRenderer.invoke('clipboard:write', value) }
})
