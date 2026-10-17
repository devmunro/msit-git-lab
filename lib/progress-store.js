const fs = require('fs')
const path = require('path')
const practiceLessons = require('./curriculum.js').lessons.map(function (lesson) { return lesson.id })

const legacyLessons = [
  'get_git', 'repository', 'commit_to_it', 'githubbin', 'remote_control', 'forks_and_clones',
  'branches_arent_just_for_birds', 'its_a_small_world', 'pull_never_out_of_date',
  'requesting_you_pull_please', 'merge_tada'
]

module.exports = function createProgressStore (dataPath) {
  const directory = path.dirname(dataPath)
  let progress
  progress = read()

  function empty () {
    const challenges = {}
    legacyLessons.forEach(function (id) { challenges[id] = false })
    return { schemaVersion: 2, challenges, labs: {}, savedRepository: null }
  }

  function read () {
    try {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
      if (data.schemaVersion === 2 && data.challenges && data.labs) return data
      const migrated = empty()
      legacyLessons.forEach(function (id) {
        migrated.challenges[id] = Boolean(data[id] && data[id].completed)
      })
      const savedPath = path.join(directory, 'saved-dir.json')
      if (fs.existsSync(savedPath)) {
        const saved = JSON.parse(fs.readFileSync(savedPath, 'utf8'))
        migrated.savedRepository = saved.savedDir || null
      }
      progress = migrated
      persist()
      return migrated
    } catch (error) {
      if (error.code !== 'ENOENT') {
        try {
          fs.copyFileSync(dataPath, dataPath + '.backup')
        } catch (backupError) {}
      }
      const initial = empty()
      progress = initial
      persist()
      return initial
    }
  }

  function persist () {
    fs.mkdirSync(directory, { recursive: true })
    fs.writeFileSync(dataPath, JSON.stringify(progress, null, 2) + '\n')
    fs.writeFileSync(path.join(directory, 'saved-dir.json'), JSON.stringify({ savedDir: progress.savedRepository }, null, 2) + '\n')
  }

  function get () {
    return JSON.parse(JSON.stringify(progress))
  }

  function setCompleted (lessonId, completed) {
    if (legacyLessons.indexOf(lessonId) !== -1) {
      progress.challenges[lessonId] = Boolean(completed)
    } else if (practiceLessons.indexOf(lessonId) !== -1) {
      if (!progress.labs[lessonId]) progress.labs[lessonId] = { completed: false, path: null }
      progress.labs[lessonId].completed = Boolean(completed)
    } else throw new Error('Unknown lesson.')
    persist()
    return get()
  }

  function setRepository (repositoryPath) {
    progress.savedRepository = repositoryPath
    persist()
  }

  function setCurrentLab (labId, labPath, resetCompleted) {
    if (practiceLessons.indexOf(labId) === -1 || typeof labPath !== 'string') throw new Error('Unknown practice lab.')
    if (!progress.labs[labId]) progress.labs[labId] = { completed: false, path: null }
    progress.labs[labId].path = labPath
    if (resetCompleted) progress.labs[labId].completed = false
    persist()
  }

  function clear () {
    const fresh = empty()
    fresh.savedRepository = progress.savedRepository
    progress = fresh
    persist()
  }

  return {
    get,
    setCompleted,
    setRepository,
    setCurrentLab,
    clear
  }
}
