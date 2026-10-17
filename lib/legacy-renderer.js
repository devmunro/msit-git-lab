(function () {
  'use strict'
  const api = window.msitGitLab
  const learningPath = window.MSIT_LEARNING_PATH
  const challenge = document.body.dataset.challenge
  const language = document.documentElement.lang === 'de' ? 'de' : 'en'
  const verifyButton = document.getElementById('verify-challenge')
  const selectButton = document.getElementById('select-directory')
  const directoryPath = document.getElementById('directory-path')
  const warning = document.getElementById('path-required-warning')
  const list = document.getElementById('verify-list')
  const clearButton = document.getElementById('clear-completed-challenge')
  const nextLink = document.getElementById('next-learning-step')

  if (nextLink) {
    nextLink.dataset.nextHref = nextLink.href
    nextLink.addEventListener('click', function (event) {
      if (nextLink.getAttribute('aria-disabled') === 'true') event.preventDefault()
    })
  }

  document.querySelectorAll('.challenge-item').forEach(function (item) {
    item.dataset.challengeHref = item.href
    item.addEventListener('click', function (event) {
      if (item.getAttribute('aria-disabled') === 'true') event.preventDefault()
    })
  })

  // Apply the locked state before async progress loads (and in browser previews).
  updateFlowProgress({ challenges: {} })

  if (!api) {
    if (verifyButton) verifyButton.disabled = true
    if (selectButton) selectButton.disabled = true
    if (list) {
      const note = document.createElement('li')
      note.className = 'verify-preview-note'
      note.textContent = language === 'de'
        ? 'Du siehst eine Browser-Vorschau. Öffne MSIT Git Lab als Desktop-App, um Ordner auszuwählen und Git-Challenges zu prüfen.'
        : 'You’re viewing a browser preview. Open MSIT Git Lab as the desktop app to select folders and verify Git challenges.'
      list.appendChild(note)
      list.classList.add('is-preview')
    }
    return
  }

  const messages = {
    'Git is not installed or is too old.': 'Git ist nicht installiert oder zu alt.',
    'Configure your global Git user.name.': 'Leg deinen Namen mit git config --global user.name "Dein Name" fest.',
    'Configure your global Git user.email.': 'Leg deine E-Mail mit git config --global user.email "du@beispiel.de" fest.',
    'Choose the repository you used for this challenge.': 'Wähl das Repository aus, das du für diese Challenge verwendet hast.',
    'This folder is not a Git repository.': 'Dieser Ordner ist kein Git-Repository.',
    'Repository is initialized.': 'Das Repository ist eingerichtet.',
    'Make at least one commit after the initial repository commit.': 'Erstelle mindestens einen Commit nach dem ersten Repository-Commit.',
    'Set a GitHub username with `git config --global user.username YOUR-NAME`.': 'Hinterlege deinen GitHub-Nutzernamen mit git config --global user.username DEIN-NAME.',
    'Add a GitHub origin remote to this repository.': 'Füge diesem Repository ein GitHub-Remote namens origin hinzu.',
    'Push a branch and set its upstream remote.': 'Push einen Branch und richte dabei sein Upstream-Remote ein.',
    'Set origin to your GitHub fork.': 'Setze origin auf deinen GitHub-Fork.',
    'Add jlord/patchwork as the upstream remote.': 'Füge jlord/patchwork als upstream-Remote hinzu.',
    'Create and switch to a new branch.': 'Erstelle einen neuen Branch und wechsle zu ihm.',
    'Connect this local repository to a remote.': 'Verbinde dieses lokale Repository mit einem Remote.',
    'Set an upstream branch for the branch you are updating.': 'Richte für den Branch, den du aktualisierst, einen Upstream-Branch ein.',
    'Pull remote changes and leave your branch up to date with a clean working tree.': 'Hol die Änderungen vom Remote und lass deinen Branch mit sauberem Arbeitsverzeichnis auf dem neuesten Stand.',
    'Push your topic branch to GitHub before opening a pull request.': 'Push deinen Topic-Branch zu GitHub, bevor du einen Pull Request öffnest.',
    'Complete a merge commit in this repository.': 'Schließe in diesem Repository einen Merge mit Commit ab.'
  }

  api.getProgress().then(function (progress) {
    const saved = progress.savedRepository
    if (saved && directoryPath) {
      directoryPath.textContent = saved
      selectButton.textContent = language === 'de' ? 'Ordner ändern' : 'Change directory'
    }
    updateFlowProgress(progress)
    if (progress.challenges[challenge]) markCompleted()
  })

  if (selectButton) {
    selectButton.addEventListener('click', async function () {
      const selected = await api.selectRepository()
      if (selected && !selected.canceled) {
        directoryPath.textContent = selected.path
        selectButton.textContent = language === 'de' ? 'Ordner ändern' : 'Change directory'
        if (warning) warning.classList.remove('show')
      }
    })
  }

  verifyButton.addEventListener('click', async function () {
    const repository = directoryPath && directoryPath.textContent
    if (selectButton && !repository) {
      if (warning) warning.classList.add('show')
      return
    }
    verifyButton.disabled = true
    if (selectButton) selectButton.disabled = true
    list.replaceChildren()
    try {
      const result = await api.verifyLesson(challenge, repository || null)
      result.checks.forEach(function (check) {
        const item = document.createElement('li')
        item.className = check.passed ? 'verify-pass' : 'verify-fail'
        item.textContent = translate(check.message)
        list.appendChild(item)
      })
      if (result.completed) {
        markCompleted()
      } else {
        verifyButton.disabled = false
        if (selectButton) selectButton.disabled = false
      }
    } catch (error) {
      const item = document.createElement('li')
      item.className = 'verify-fail'
      item.textContent = error.message
      list.appendChild(item)
      verifyButton.disabled = false
      if (selectButton) selectButton.disabled = false
    }
  })

  clearButton.addEventListener('click', async function () {
    await api.setProgress(challenge, false)
    clearButton.style.display = 'none'
    verifyButton.disabled = false
    if (selectButton) selectButton.disabled = false
    const item = document.getElementById(challenge)
    if (item) item.classList.remove('completed')
    updateFlowProgress(await api.getProgress())
  })

  function translate (message) {
    if (language !== 'de') return message
    if (/^git version /.test(message)) return 'Git wurde gefunden: ' + message
    return messages[message] || message
  }

  function markCompleted () {
    verifyButton.disabled = true
    if (selectButton) selectButton.disabled = true
    clearButton.style.display = 'inline-block'
    const current = document.getElementById(challenge)
    if (current) current.classList.add('completed')
    const header = document.getElementById('challenge-header')
    if (header) header.classList.add('challenge-is-completed')
    api.getProgress().then(function (progress) {
      updateFlowProgress(progress)
      document.querySelectorAll('.challenge-item').forEach(function (item) {
        if (item.id && progress.challenges[item.id]) item.classList.add('completed')
      })
    })
  }

  function updateFlowProgress (progress) {
    document.querySelectorAll('.challenge-item').forEach(function (item) {
      const index = learningPath.challenges.findIndex(function (entry) { return entry.id === item.id })
      if (index === -1) return
      const state = learningPath.challengeState(progress, index)
      const unlocked = state !== 'locked'
      item.href = unlocked ? item.dataset.challengeHref : '#'
      item.setAttribute('aria-disabled', String(!unlocked))
      item.tabIndex = unlocked ? 0 : -1
      item.classList.toggle('is-disabled', !unlocked)
      item.classList.toggle('completed', state === 'completed')
      item.classList.toggle('is-next', state === 'available')
    })
    if (nextLink) {
      const unlocked = Boolean(progress.challenges[challenge])
      nextLink.href = unlocked ? nextLink.dataset.nextHref : '#'
      nextLink.setAttribute('aria-disabled', String(!unlocked))
      nextLink.tabIndex = unlocked ? 0 : -1
      nextLink.classList.toggle('is-disabled', !unlocked)
    }
  }
})()
