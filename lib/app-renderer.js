(function () {
  'use strict'

  const api = window.msitGitLab
  const previewMode = !api
  const learningPath = window.MSIT_LEARNING_PATH
  const lessons = learningPath.orderedLessons(window.MSIT_CURRICULUM.lessons)
  const localeCode = window.location.pathname.match(/built\/([a-z]{2}-[A-Z]{2})/) || []
  const language = localeCode[1] === 'de-DE' ? 'de' : 'en'
  let requestedLesson = new URLSearchParams(window.location.search).get('lesson')
  const root = document.getElementById('lesson-list')
  let state = null

  function text (en, de) { return language === 'de' ? de : en }
  function element (tag, className, content) {
    const node = document.createElement(tag)
    if (className) node.className = className
    if (content !== undefined) node.textContent = content
    return node
  }
  function button (label, className, action) {
    const node = element('button', className, label)
    node.type = 'button'
    node.addEventListener('click', action)
    return node
  }

  async function initialize () {
    state = previewMode ? { labs: {}, challenges: {}, savedRepository: null } : await api.getProgress()
    const resume = learningPath.nextStep(state, lessons)
    requestedLesson = lessons.some(function (lesson) { return lesson.id === requestedLesson }) ? requestedLesson : (resume.type === 'practice' ? resume.id : lessons[0].id)
    renderLessons()
    renderStatus()
    document.getElementById('git-help-button').addEventListener('click', function () {
      api.openExternal('https://git-scm.com/downloads')
    })
  }

  function renderLessons () {
    root.replaceChildren()
    const activeLesson = lessons.find(function (lesson) { return lesson.id === requestedLesson }) || lessons[0]
    let stages = [
      {
        level: 'Intermediate',
        id: 'intermediate-practice',
        number: '02',
        en: { title: 'Build confident Git workflows', copy: 'Practice staging, branches, merges, stashes, remotes and tags.' },
        de: { title: 'Git-Abläufe sicher beherrschen', copy: 'Übe Staging, Branches, Merges, Stash, Remotes und Tags.' }
      },
      {
        level: 'Advanced',
        id: 'advanced-practice',
        number: '03',
        en: { title: 'Go deeper with Git', copy: 'Work through conflicts, rebase, cherry-pick, recovery and bisect.' },
        de: { title: 'Geh bei Git in die Tiefe', copy: 'Übe Konflikte, Rebase, Cherry-pick, Wiederherstellung und Bisect.' }
      }
    ]
    stages = stages.filter(function (stage) { return stage.level === activeLesson.level })
    const stageGrids = {}
    stages.forEach(function (stage) {
      const section = element('section', 'practice-stage')
      section.id = stage.id
      const heading = element('div', 'practice-stage-heading')
      heading.appendChild(element('span', 'route-number', stage.number))
      const titleBlock = element('div', 'practice-stage-copy')
      titleBlock.appendChild(element('h3', '', stage[language].title))
      titleBlock.appendChild(element('p', '', stage[language].copy))
      heading.appendChild(titleBlock)
      section.appendChild(heading)
      const grid = element('div', 'lesson-grid')
      section.appendChild(grid)
      root.appendChild(section)
      stageGrids[stage.level] = grid
    })
    lessons.forEach(function (lesson) {
      if (lesson.id !== activeLesson.id) return
      const localized = lesson[language]
      const progress = state.labs[lesson.id] || { completed: false, path: null }
      const card = element('article', 'lesson-card' + (progress.completed ? ' is-complete' : ''))
      const cardTop = element('div', 'lesson-card-top')
      const level = element('span', 'level-label ' + lesson.level.toLowerCase(), text(lesson.level, lesson.level === 'Advanced' ? 'Fortgeschritten' : 'Mittelstufe'))
      const complete = element('span', 'complete-label', progress.completed ? text('Done', 'Erledigt') : '')
      cardTop.append(level, complete)
      card.appendChild(cardTop)
      card.appendChild(element('h3', 'lesson-title', localized.title))
      card.appendChild(element('p', 'lesson-summary', localized.summary))
      if (lesson.effect) card.appendChild(graph(lesson.effect))
      card.appendChild(element('p', 'lesson-goal', localized.goal))

      const details = document.createElement('details')
      details.className = 'lesson-details'
      const summary = element('summary', '', text('Show the steps', 'Schritte anzeigen'))
      details.appendChild(summary)
      const ordered = document.createElement('ol')
      localized.steps.forEach(function (step) { ordered.appendChild(element('li', '', step)) })
      details.appendChild(ordered)
      card.appendChild(details)

      const actionRow = element('div', 'lesson-actions')
      const openLab = button(progress.path ? text('Open lab', 'Lab öffnen') : text('Create lab', 'Lab anlegen'), 'button button-primary', async function () {
        await withError(card, async function () {
          const result = await api.createLab(lesson.id)
          state = await api.getProgress()
          renderLessons()
          showLabInstructions(lesson, result.path)
        })
      })
      if (previewMode) {
        openLab.disabled = true
        openLab.title = text('Lab setup is available in the desktop app.', 'Labs legst du in der Desktop-App an.')
      }
      actionRow.appendChild(openLab)
      if (progress.path) {
        actionRow.appendChild(button(text('Check my work', 'Ergebnis prüfen'), 'button button-outline', async function () {
          await withError(card, async function () {
            const result = await api.verifyLab(lesson.id, progress.path)
            await showResult(card, result, lesson)
            state = await api.getProgress()
            renderLessons()
          })
        }))
        actionRow.appendChild(button(text('Start fresh', 'Neu anfangen'), 'button button-quiet', async function () {
          const confirmed = window.confirm(text('This replaces the generated lab folder with a fresh copy. Continue?', 'Dabei wird der erzeugte Lab-Ordner durch eine frische Version ersetzt. Fortfahren?'))
          if (!confirmed) return
          await withError(card, async function () {
            const result = await api.resetLab(lesson.id)
            state = await api.getProgress()
            renderLessons()
            showLabInstructions(lesson, result.path)
          })
        }))
      }
      card.appendChild(actionRow)
      if (lesson.followupLegacyId) {
        const followup = document.createElement('a')
        followup.className = 'followup-link'
        followup.href = '../challenges/' + lesson.followupLegacyId + '.html'
        followup.textContent = text('Continue to the real GitHub pull request →', 'Weiter zum echten GitHub-Pull-Request →')
        card.appendChild(followup)
      }

      if (progress.path) {
        const pathBox = element('div', 'repo-location')
        pathBox.appendChild(element('span', 'micro-label', text('PRACTICE FOLDER', 'ÜBUNGSORDNER')))
        pathBox.appendChild(element('code', '', progress.path))
        pathBox.appendChild(button(text('Copy terminal command', 'Terminal-Befehl kopieren'), 'copy-button', function () {
          api.copyText('cd "' + progress.path + '"')
        }))
        card.appendChild(pathBox)
      }

      const hints = document.createElement('details')
      hints.className = 'command-hints'
      hints.appendChild(element('summary', '', text('Command ideas', 'Befehle als Starthilfe')))
      const list = document.createElement('ul')
      localized.hints.forEach(function (hint) { list.appendChild(element('li', 'command-chip', hint)) })
      hints.appendChild(list)
      card.appendChild(hints)

      if (localized.warning) card.appendChild(element('p', 'safety-note', localized.warning))
      if (lesson.checkpoint) card.appendChild(checkpoint(lesson.checkpoint))
      stageGrids[lesson.level].appendChild(card)
    })
    setProgress()
    renderStepNavigation(activeLesson)
    startGraphMotion()
  }

  function renderStepNavigation (lesson) {
    const index = lessons.findIndex(function (item) { return item.id === lesson.id })
    const position = learningPath.challenges.length + index + 1
    const progress = learningPath.completedCount(state, lessons)
    const previous = index === 0
      ? { type: 'challenge', id: 'merge_tada' }
      : { type: 'practice', id: lessons[index - 1].id }
    const next = index < lessons.length - 1
      ? { type: 'practice', id: lessons[index + 1].id }
      : { type: 'repository', id: 'own-repository' }
    const previousLink = document.getElementById('previous-step')
    const nextLink = document.getElementById('next-step')
    const label = document.getElementById('flow-step-label')
    renderBreadcrumbs(lesson)
    const canContinue = previewMode || Boolean(state.labs[lesson.id] && state.labs[lesson.id].completed)

    label.textContent = text('Step ' + position + ' of ' + learningPath.totalSteps, 'Schritt ' + position + ' von ' + learningPath.totalSteps)
    previousLink.href = stepHref(previous)
    previousLink.textContent = text('← Previous step', '← Vorheriger Schritt')
    nextLink.href = canContinue ? stepHref(next) : '#'
    nextLink.textContent = canContinue
      ? (next.type === 'repository'
          ? text('Continue to your repository →', 'Weiter zu deinem Repository →')
          : text('Next practice step →', 'Weiter zur nächsten Übung →'))
      : text('Verify this lab to continue →', 'Prüfe dieses Lab, um weiterzugehen →')
    nextLink.setAttribute('aria-disabled', String(!canContinue))
    nextLink.tabIndex = canContinue ? 0 : -1
    nextLink.classList.toggle('is-disabled', !canContinue)
    nextLink.onclick = function (event) { if (!canContinue) event.preventDefault() }
    document.getElementById('step-complete-count').textContent = text(progress + ' of ' + learningPath.totalSteps + ' steps completed', progress + ' von ' + learningPath.totalSteps + ' Schritten abgeschlossen')
  }

  function renderBreadcrumbs (lesson) {
    const nav = document.getElementById('learning-breadcrumbs')
    if (!nav) return
    const list = document.createElement('ol')
    const items = [
      { label: text('Learning path', 'Lernpfad'), href: 'index.html' },
      { label: text('Guided practice', 'Geführte Übungen') },
      { label: lesson.level === 'Advanced' ? text('Advanced practice', 'Fortgeschritten') : text('Intermediate practice', 'Aufbau') },
      { label: lesson[language].title, current: true }
    ]
    items.forEach(function (item) {
      const li = document.createElement('li')
      if (item.href) {
        const link = element('a', '', item.label)
        link.href = item.href
        li.appendChild(link)
      } else {
        li.appendChild(element(item.current ? 'span' : 'span', '', item.label))
      }
      if (item.current) li.setAttribute('aria-current', 'page')
      list.appendChild(li)
    })
    nav.replaceChildren(list)
  }

  function stepHref (step) {
    if (step.type === 'challenge') return '../challenges/' + step.id + '.html'
    if (step.type === 'practice') return 'practice.html?lesson=' + encodeURIComponent(step.id)
    return 'own-repository.html'
  }

  function graph (effect) {
    const figure = element('figure', 'git-graph graph-' + effect)
    figure.setAttribute('aria-label', effect === 'merge'
      ? text('A feature commit joins the main branch in a merge.', 'Ein Feature-Commit wird in den main-Branch gemergt.')
      : text('A feature commit is replayed on the latest main commit during a rebase.', 'Ein Feature-Commit wird beim Rebase auf dem aktuellen main-Commit erneut angewendet.'))
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 232 82')
    svg.setAttribute('role', 'img')
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
    title.textContent = effect === 'merge' ? text('Merge graph', 'Merge-Graph') : text('Rebase graph', 'Rebase-Graph')
    svg.appendChild(title)
    ;[
      { d: 'M 18 58 H 212', c: 'graph-line main-line' },
      { d: 'M 18 58 C 50 58 52 20 88 20 H 128 C 156 20 160 58 178 58', c: 'graph-line feature-line' }
    ].forEach(function (spec) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('d', spec.d)
      path.setAttribute('class', spec.c)
      svg.appendChild(path)
    })
    ;[
      { x: 18, y: 58, c: 'graph-node base-node' },
      { x: 68, y: 58, c: 'graph-node main-node' },
      { x: 128, y: 20, c: 'graph-node feature-node' },
      { x: 212, y: 58, c: 'graph-node main-node' },
      { x: 88, y: 20, c: 'graph-node moving-node' }
    ].forEach(function (spec) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', spec.x)
      circle.setAttribute('cy', spec.y)
      circle.setAttribute('r', spec.c.indexOf('moving') !== -1 ? 6 : 4.5)
      circle.setAttribute('class', spec.c)
      svg.appendChild(circle)
    })
    figure.appendChild(svg)
    figure.appendChild(element('figcaption', '', effect === 'merge'
      ? text('Merge keeps both lines of history.', 'Beim Merge bleiben beide Historien sichtbar.')
      : text('Rebase replays commits on the updated base.', 'Beim Rebase werden Commits auf der aktualisierten Basis erneut angewendet.')))
    return figure
  }

  function startGraphMotion () {
    const figures = document.querySelectorAll('.git-graph')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!('IntersectionObserver' in window)) {
      figures.forEach(function (figure) { figure.classList.add('is-playing') })
      return
    }
    let observer = null
    observer = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-playing')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.6 })
    figures.forEach(function (figure) { observer.observe(figure) })
  }

  function checkpoint (data) {
    const details = document.createElement('details')
    details.className = 'checkpoint'
    details.appendChild(element('summary', '', text('Optional quick check', 'Optionaler Kurz-Check')))
    const form = document.createElement('fieldset')
    form.appendChild(element('legend', '', data.question[language === 'de' ? 1 : 0]))
    const options = data.choices[language === 'de' ? 1 : 0]
    options.forEach(function (choice, index) {
      const label = element('label', 'answer-choice')
      const input = document.createElement('input')
      input.type = 'radio'
      input.name = 'checkpoint-' + Math.random().toString(36).slice(2)
      input.value = String(index)
      label.append(input, element('span', '', choice))
      form.appendChild(label)
    })
    const outcome = element('p', 'checkpoint-outcome')
    outcome.setAttribute('aria-live', 'polite')
    const check = button(text('Check answer', 'Antwort prüfen'), 'button button-outline', function () {
      const selected = form.querySelector('input:checked')
      if (!selected) {
        outcome.textContent = text('Choose an answer first.', 'Wähl zuerst eine Antwort aus.')
        outcome.className = 'checkpoint-outcome needs-answer'
        return
      }
      const correct = Number(selected.value) === data.answer
      outcome.textContent = (correct ? text('That’s right. ', 'Richtig. ') : text('Not quite. Try again. ', 'Noch nicht ganz. Versuch es noch mal. ')) + data.explanation[language === 'de' ? 1 : 0]
      outcome.className = 'checkpoint-outcome ' + (correct ? 'correct-answer' : 'incorrect-answer')
      if (correct) check.disabled = true
    })
    details.append(form, check, outcome)
    return details
  }

  function showLabInstructions (lesson, repoPath) {
    const cards = Array.from(document.querySelectorAll('.lesson-card'))
    const card = cards.find(function (item) { return item.querySelector('h3').textContent === lesson[language].title })
    if (!card) return
    const panel = element('div', 'terminal-nudge', text('Open your regular terminal and run:', 'Öffne dein normales Terminal und führe aus:'))
    panel.appendChild(element('code', '', 'cd "' + repoPath + '"'))
    card.insertBefore(panel, card.querySelector('.command-hints'))
    panel.scrollIntoView({ behavior: 'auto', block: 'nearest' })
  }

  async function showResult (card, result, lesson) {
    const old = card.querySelector('.verification-result')
    if (old) old.remove()
    const panel = element('div', 'verification-result ' + (result.completed ? 'result-pass' : 'result-pending'))
    panel.setAttribute('role', 'status')
    panel.appendChild(element('strong', '', result.completed ? text('Nice work — verified.', 'Sehr gut — Übung bestanden.') : text('Not there yet.', 'Noch nicht ganz.')))
    panel.appendChild(element('p', '', localizeLabMessage(result.message)))
    card.appendChild(panel)
  }

  function localizeLabMessage (message) {
    if (language !== 'de') return message
    const translations = {
      'Choose or create this practice repository first.': 'Leg zuerst dieses Übungs-Repository an oder öffne es.',
      'Stage and commit notes.md, then make sure the working tree is clean.': 'Stage und committe notes.md. Danach sollte das Arbeitsverzeichnis sauber sein.',
      'Create feature/summary, commit feature.md, and merge it into main.': 'Lege feature/summary an, committe feature.md und merge den Branch in main.',
      'Resolve greeting.txt, stage it, and commit the merge.': 'Löse den Konflikt in greeting.txt, stage die Datei und committe den Merge.',
      'Rebase feature/rebase onto main, then fast-forward main.': 'Rebase feature/rebase auf main und aktualisiere main danach per Fast-Forward.',
      'Squash the three feature commits into one and keep all three guide files.': 'Fasse die drei Feature-Commits zusammen und behalte alle drei Guide-Dateien.',
      'Stash both changes, restore them, and remove the stash entry.': 'Stashe beide Änderungen, hol sie zurück und entferne den Stash-Eintrag.',
      'Cherry-pick the fix commit from topic/fix onto main.': 'Cherry-picke den Fix-Commit aus topic/fix auf main.',
      'Reset one commit, find it in reflog, and cherry-pick it back.': 'Setz einen Commit zurück, such ihn im Reflog und cherry-picke ihn wieder zurück.',
      'Create an annotated v1.0.0 tag on the current commit.': 'Erstelle für den aktuellen Commit den annotierten Tag v1.0.0.',
      'Find the first bad commit with bisect, tag it bisect-found, and run bisect reset.': 'Finde den ersten fehlerhaften Commit mit bisect, tagge ihn als bisect-found und beende die Suche mit bisect reset.'
    }
    return translations[message] || message
  }

  async function withError (card, action) {
    const old = card.querySelector('.verification-result')
    if (old) old.remove()
    try {
      await action()
    } catch (error) {
      const panel = element('div', 'verification-result result-error')
      panel.setAttribute('role', 'alert')
      panel.textContent = error.message || text('Something went wrong.', 'Da ist etwas schiefgelaufen.')
      card.appendChild(panel)
    }
  }

  function setProgress () {
    const finished = learningPath.completedCount(state, lessons)
    document.getElementById('overall-progress').textContent = finished + ' / ' + learningPath.totalSteps
    const dots = document.querySelector('.flow-progress-overview .progress-dots')
    learningPath.renderProgressDots(dots, finished)
  }

  async function renderStatus () {
    const title = document.getElementById('git-status-title')
    const copy = document.getElementById('git-status-copy')
    const action = document.getElementById('git-help-button')
    const dot = document.querySelector('.status-dot')
    document.getElementById('language-name').textContent = text('English', 'Deutsch')
    if (previewMode) {
      title.textContent = text('Browser preview', 'Browser-Vorschau')
      copy.textContent = text('The lab steps are shown here. Git checks and lab setup are available in the desktop app.', 'Hier siehst du die Übungsschritte. Git-Prüfungen und Labs funktionieren in der Desktop-App.')
      action.hidden = true
      dot.classList.add('status-preview')
      return
    }
    const diagnose = await api.diagnoseGit()
    if (!diagnose.installed) {
      title.textContent = text('Git was not found.', 'Git wurde nicht gefunden.')
      copy.textContent = text('Install Git from git-scm.com, then restart Git Lab.', 'Installiere Git von git-scm.com und starte Git Lab danach neu.')
      action.hidden = false
      dot.classList.add('status-problem')
      return
    }
    if (!diagnose.supported) {
      title.textContent = text('Your Git version needs an update.', 'Deine Git-Version sollte aktualisiert werden.')
      copy.textContent = diagnose.version + ' · ' + text('Version 2.39 or newer is recommended.', 'Empfohlen wird Version 2.39 oder neuer.')
      action.hidden = false
      dot.classList.add('status-problem')
      return
    }
    title.textContent = text('Git is ready · ', 'Git ist startklar · ') + diagnose.version
    if (diagnose.userNameConfigured && diagnose.userEmailConfigured) {
      copy.textContent = text('Your Git identity is set up. Finish this step when you’re ready.', 'Deine Git-Identität ist eingerichtet. Mach mit diesem Schritt weiter, wenn du soweit bist.')
    } else {
      copy.textContent = text('Before your first commit, set your name and email in Git:', 'Leg vor deinem ersten Commit deinen Namen und deine E-Mail in Git fest:') + text(' git config --global user.name "Your Name" · git config --global user.email "you@example.com"', ' git config --global user.name "Dein Name" · git config --global user.email "du@beispiel.de"')
      dot.classList.add('status-problem')
    }
  }

  initialize().catch(function (error) {
    root.textContent = error.message || text('Could not load practice labs.', 'Die Übungslabs konnten nicht geladen werden.')
  })
})()
