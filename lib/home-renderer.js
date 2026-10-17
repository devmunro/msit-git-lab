(function () {
  'use strict'

  const api = window.msitGitLab
  const language = document.documentElement.lang === 'de' ? 'de' : 'en'
  const path = window.MSIT_LEARNING_PATH
  const link = document.getElementById('continue-learning')
  const copy = document.getElementById('resume-copy')
  const label = document.getElementById('flow-progress-label')
  const dots = document.querySelector('.flow-progress-overview .progress-dots')
  const pathList = document.getElementById('challenge-path')

  function text (en, de) { return language === 'de' ? de : en }
  function setLinkLabel (en, de) { link.firstChild.nodeValue = text(en, de) + ' ' }

  function renderPath (progress) {
    const basics = document.createElement('section')
    const advanced = document.createElement('section')
    const basicsTitle = document.createElement('h3')
    const advancedTitle = document.createElement('h3')
    const basicList = document.createElement('ol')
    const advancedList = document.createElement('ol')
    basics.className = 'challenge-path-stage'
    advanced.className = 'challenge-path-stage'
    basicList.className = 'challenge-path-list'
    advancedList.className = 'challenge-path-list'
    basicsTitle.textContent = text('Basics', 'Grundlagen')
    advancedTitle.textContent = text('Advanced', 'Fortgeschritten')
    basics.appendChild(basicsTitle)
    basics.appendChild(basicList)
    advanced.appendChild(advancedTitle)
    advanced.appendChild(advancedList)

    path.challenges.forEach(function (challenge, index) {
      const state = path.challengeState(progress, index)
      const item = document.createElement('li')
      const targetList = index < 6 ? basicList : advancedList
      const marker = document.createElement('span')
      let control
      item.className = 'challenge-path-item is-' + state
      marker.className = 'path-step-marker'
      marker.setAttribute('aria-hidden', 'true')
      marker.textContent = state === 'completed' ? '✓' : (state === 'locked' ? '🔒' : String(index + 1))
      if (state === 'locked') {
        control = document.createElement('span')
        control.className = 'path-step-link is-locked'
        control.setAttribute('aria-disabled', 'true')
        control.setAttribute('aria-label', text('Locked: ', 'Gesperrt: ') + challenge[language])
        control.title = text('Complete the previous challenge to unlock this one.', 'Schließ erst die vorherige Challenge ab, um diese freizuschalten.')
      } else {
        control = document.createElement('a')
        control.className = 'path-step-link'
        control.href = '../challenges/' + challenge.id + '.html'
        if (state === 'available') control.setAttribute('aria-current', 'step')
      }
      const title = document.createElement('span')
      title.textContent = challenge[language]
      control.appendChild(marker)
      control.appendChild(title)
      item.appendChild(control)
      targetList.appendChild(item)
    })

    pathList.replaceChildren(basics, advanced)
    if (progress.challenges && path.challenges.every(function (challenge) { return progress.challenges[challenge.id] })) {
      const own = document.createElement('a')
      own.className = 'path-own-repository'
      own.href = 'own-repository.html'
      own.textContent = text('Continue to your own repository →', 'Weiter zu deinem eigenen Repository →')
      pathList.appendChild(own)
    }
  }

  function render (progress) {
    progress = progress || { challenges: {} }
    progress.challenges = progress.challenges || {}
    const step = path.nextStep(progress)
    const completed = path.completedCount(progress)
    let stepTitle

    label.textContent = completed + ' / ' + path.totalSteps
    path.renderProgressDots(dots, completed)
    dots.setAttribute('aria-valuetext', text(completed + ' of ' + path.totalSteps + ' steps completed', completed + ' von ' + path.totalSteps + ' Schritten abgeschlossen'))
    renderPath(progress)

    if (step.type === 'challenge') {
      const index = path.challenges.findIndex(function (item) { return item.id === step.id })
      stepTitle = path.challenges[index][language]
      link.href = '../challenges/' + step.id + '.html'
      setLinkLabel('Start challenge ' + (index + 1), 'Challenge ' + (index + 1) + ' starten')
      copy.textContent = text('Your next step: challenge ' + (index + 1) + ' — ' + stepTitle + '.', 'Dein nächster Schritt: Challenge ' + (index + 1) + ' – ' + stepTitle + '.')
    } else {
      link.href = 'own-repository.html'
      setLinkLabel('Continue to your repository', 'Weiter zu deinem Repository')
      copy.textContent = text('You’ve finished the original challenges. Now put what you learned to work in your own repository.', 'Du hast alle Original-Challenges geschafft. Jetzt kannst du das Gelernte in deinem eigenen Repository anwenden.')
    }
  }

  const initialProgress = { challenges: {} }
  const request = api && typeof api.getProgress === 'function' ? api.getProgress() : Promise.resolve(initialProgress)
  request.then(render).catch(function () {
    render(initialProgress)
    copy.textContent = text('Could not load your saved progress. Start with challenge 1: Get Git.', 'Dein gespeicherter Fortschritt konnte nicht geladen werden. Starte mit Challenge 1: Git installieren.')
  })
})()
