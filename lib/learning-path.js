(function (root, factory) {
  const path = factory()
  if (typeof module === 'object' && module.exports) module.exports = path
  else root.MSIT_LEARNING_PATH = path
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const challenges = [
    { id: 'get_git', en: 'Get Git', de: 'Git installieren' },
    { id: 'repository', en: 'Repository', de: 'Repository' },
    { id: 'commit_to_it', en: 'Commit to it', de: 'Commit it' },
    { id: 'githubbin', en: 'GitHubbin', de: 'GitHubbin' },
    { id: 'remote_control', en: 'Remote Control', de: 'Remote Control' },
    { id: 'forks_and_clones', en: 'Forks and Clones', de: 'Forks und Klone' },
    { id: 'branches_arent_just_for_birds', en: "Branches aren't just for birds", de: 'Branches sind nicht nur was für Vögel' },
    { id: 'its_a_small_world', en: "It's a small world", de: 'Eine kleine Welt' },
    { id: 'pull_never_out_of_date', en: 'Pull, never out of date', de: 'Immer auf dem neuesten Stand' },
    { id: 'requesting_you_pull_please', en: 'Requesting you pull, please', de: 'Ein Pull Request, bitte' },
    { id: 'merge_tada', en: 'Merge, tada!', de: 'Merge, tada!' }
  ]
  const practiceOrder = [
    'stage-commit', 'branch-merge', 'stash', 'remote-workflow', 'tags',
    'merge-conflict', 'rebase', 'interactive-rebase', 'cherry-pick', 'reset-reflog', 'bisect'
  ]
  const totalSteps = challenges.length + 1

  function renderProgressDots (container, completed) {
    if (!container) return
    container.replaceChildren()
    container.setAttribute('aria-valuemax', totalSteps)
    container.setAttribute('aria-valuenow', completed)
    for (let index = 0; index < totalSteps; index++) {
      const dot = container.ownerDocument.createElement('span')
      dot.className = 'progress-dot' + (index < completed ? ' is-complete' : (index === completed ? ' is-next' : ''))
      dot.setAttribute('aria-hidden', 'true')
      container.appendChild(dot)
    }
  }

  function orderedLessons (lessons) {
    const ordered = practiceOrder.map(function (id) {
      return lessons.find(function (lesson) { return lesson.id === id })
    }).filter(Boolean)
    lessons.forEach(function (lesson) {
      if (practiceOrder.indexOf(lesson.id) === -1) ordered.push(lesson)
    })
    return ordered
  }

  function nextStep (progress) {
    progress = progress || { challenges: {}, labs: {} }
    const challenge = challenges.find(function (item) { return !progress.challenges[item.id] })
    if (challenge) return { type: 'challenge', id: challenge.id }
    return { type: 'repository', id: 'own-repository' }
  }

  function challengeState (progress, index) {
    progress = progress || { challenges: {} }
    const challenge = challenges[index]
    if (!challenge) return 'locked'
    if (progress.challenges[challenge.id]) return 'completed'
    const previous = challenges.slice(0, index)
    return previous.every(function (item) { return Boolean(progress.challenges[item.id]) }) ? 'available' : 'locked'
  }

  function completedCount (progress) {
    progress = progress || { challenges: {}, labs: {} }
    return challenges.filter(function (item) { return progress.challenges[item.id] }).length +
      (progress.savedRepository ? 1 : 0)
  }

  return { challenges, practiceOrder, orderedLessons, nextStep, challengeState, completedCount, renderProgressDots, totalSteps }
})
