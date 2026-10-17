(function () {
  'use strict'

  const api = window.msitGitLab
  const language = document.documentElement.lang === 'de' ? 'de' : 'en'
  const path = window.MSIT_LEARNING_PATH
  const selected = document.getElementById('selected-repository')
  const button = document.getElementById('choose-repository')
  const note = document.getElementById('repository-note')
  const label = document.getElementById('overall-progress')
  const progressCopy = document.getElementById('step-complete-count')
  const dots = document.querySelector('.flow-progress-overview .progress-dots')

  function text (en, de) { return language === 'de' ? de : en }
  function update (progress) {
    const completed = path.completedCount(progress, window.MSIT_CURRICULUM ? window.MSIT_CURRICULUM.lessons : [])
    selected.textContent = progress.savedRepository || text('No repository selected yet.', 'Noch kein Repository ausgewählt.')
    label.textContent = completed + ' / ' + path.totalSteps
    progressCopy.textContent = text(completed + ' of ' + path.totalSteps + ' steps completed', completed + ' von ' + path.totalSteps + ' Schritten abgeschlossen')
    path.renderProgressDots(dots, completed)
    dots.setAttribute('aria-valuetext', text(completed + ' of ' + path.totalSteps + ' steps completed', completed + ' von ' + path.totalSteps + ' Schritten abgeschlossen'))
    if (progress.savedRepository) note.textContent = text('Your project is ready. Use your regular terminal to keep practicing here.', 'Dein Projekt ist startklar. Übe hier mit deinem normalen Terminal weiter.')
  }

  if (!api) {
    button.disabled = true
    button.title = text('Repository selection is available in the desktop app.', 'Dein Repository kannst du in der Desktop-App auswählen.')
    note.textContent = text('Choose a repository in the desktop app to continue practicing here.', 'Wähl in der Desktop-App ein Repository aus, um hier weiterzuüben.')
    return
  }

  api.getProgress().then(update).catch(function () {
    note.textContent = text('Could not load your saved progress.', 'Dein gespeicherter Fortschritt konnte nicht geladen werden.')
  })
  button.addEventListener('click', async function () {
    button.disabled = true
    try {
      const result = await api.selectRepository()
      if (result && !result.canceled) update(await api.getProgress())
    } catch (error) {
      note.textContent = error.message || text('Could not select that folder.', 'Der Ordner konnte nicht ausgewählt werden.')
    } finally {
      button.disabled = false
    }
  })
})()
