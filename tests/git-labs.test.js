'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const labs = require('../lib/labs.js')
const git = require('../lib/git-service.js')
const progressStore = require('../lib/progress-store.js')
const lessons = require('../lib/curriculum.js').lessons

function workspace () {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'msit-git-lab-test-'))
}

async function makeLab (id, root) {
  const created = await labs.create(id, root)
  assert.equal(created.reused, false)
  assert.equal(fs.realpathSync(await git.runGit(['rev-parse', '--show-toplevel'], { cwd: created.path })), fs.realpathSync(created.path))
  return created.path
}

async function addCommit (cwd, files, message) {
  Object.keys(files).forEach(function (name) { fs.writeFileSync(path.join(cwd, name), files[name], 'utf8') })
  await git.runGit(['add', '--all'], { cwd })
  await git.runGit(['commit', '-m', message], { cwd })
}

test('all practice labs use generated, repeatable repositories with Git checkpoints', async function (t) {
  const root = workspace()
  t.after(function () { fs.rmSync(root, { recursive: true, force: true }) })

  let cwd = await makeLab('stage-commit', root)
  await git.runGit(['add', 'notes.md'], { cwd })
  await git.runGit(['commit', '-m', 'Add practice notes'], { cwd })
  assert.equal((await labs.verify('stage-commit', cwd)).completed, true)

  cwd = await makeLab('branch-merge', root)
  await git.runGit(['switch', '-c', 'feature/summary'], { cwd })
  await addCommit(cwd, { 'feature.md': 'A feature summary.\n' }, 'Add feature summary')
  await git.runGit(['switch', 'main'], { cwd })
  await git.runGit(['merge', 'feature/summary'], { cwd })
  assert.equal((await labs.verify('branch-merge', cwd)).completed, true)

  cwd = await makeLab('merge-conflict', root)
  await assert.rejects(git.runGit(['merge', 'feature/welcome'], { cwd }))
  fs.writeFileSync(path.join(cwd, 'greeting.txt'), 'Welcome to the Git Lab. Bring a friend and pick a project.\n')
  await git.runGit(['add', 'greeting.txt'], { cwd })
  await git.runGit(['commit', '-m', 'Resolve the greeting conflict'], { cwd })
  assert.equal((await labs.verify('merge-conflict', cwd)).completed, true)

  cwd = await makeLab('rebase', root)
  await git.runGit(['switch', 'feature/rebase'], { cwd })
  await git.runGit(['rebase', 'main'], { cwd })
  await git.runGit(['switch', 'main'], { cwd })
  await git.runGit(['merge', '--ff-only', 'feature/rebase'], { cwd })
  assert.equal((await labs.verify('rebase', cwd)).completed, true)

  cwd = await makeLab('interactive-rebase', root)
  await git.runGit(['reset', '--soft', 'main'], { cwd })
  await git.runGit(['commit', '-m', 'Combine the documentation steps'], { cwd })
  assert.equal((await labs.verify('interactive-rebase', cwd)).completed, true)

  cwd = await makeLab('stash', root)
  await git.runGit(['stash', 'push', '-u', '-m', 'draft work'], { cwd })
  await git.runGit(['stash', 'pop'], { cwd })
  assert.equal((await labs.verify('stash', cwd)).completed, true)

  cwd = await makeLab('cherry-pick', root)
  const cherryCommit = await git.runGit(['rev-parse', 'topic/fix'], { cwd })
  await git.runGit(['cherry-pick', cherryCommit], { cwd })
  assert.equal((await labs.verify('cherry-pick', cwd)).completed, true)

  cwd = await makeLab('remote-workflow', root)
  await git.runGit(['switch', 'feature/request-review'], { cwd })
  await git.runGit(['push', '-u', 'origin', 'feature/request-review'], { cwd })
  await git.runGit(['fetch', 'origin'], { cwd })
  await git.runGit(['diff', '--stat', 'origin/main...origin/feature/request-review'], { cwd })
  await git.runGit(['switch', 'main'], { cwd })
  assert.equal((await labs.verify('remote-workflow', cwd)).completed, true)

  cwd = await makeLab('reset-reflog', root)
  const recoverCommit = await git.runGit(['rev-parse', 'HEAD'], { cwd })
  await git.runGit(['reset', '--hard', 'HEAD~1'], { cwd })
  await git.runGit(['cherry-pick', recoverCommit], { cwd })
  assert.equal((await labs.verify('reset-reflog', cwd)).completed, true)

  cwd = await makeLab('tags', root)
  await git.runGit(['tag', '-a', 'v1.0.0', '-m', 'First practice release'], { cwd })
  assert.equal((await labs.verify('tags', cwd)).completed, true)

  cwd = await makeLab('bisect', root)
  await git.runGit(['bisect', 'start'], { cwd })
  await git.runGit(['bisect', 'bad'], { cwd })
  await git.runGit(['bisect', 'good', 'HEAD~3'], { cwd })
  let foundBadCommit = false
  let firstBadCommit = null
  for (let attempt = 0; attempt < 8; attempt++) {
    const feature = await git.tryGit(['show', 'HEAD:feature.flag'], cwd)
    const marked = await git.runGit(['bisect', feature.ok && feature.output === 'broken' ? 'bad' : 'good'], { cwd })
    const firstBadMatch = marked.match(/^([0-9a-f]+) is the first bad commit/im)
    if (firstBadMatch) {
      foundBadCommit = true
      firstBadCommit = firstBadMatch[1]
      break
    }
  }
  assert.equal(foundBadCommit, true)
  await git.runGit(['tag', 'bisect-found', firstBadCommit], { cwd })
  await git.runGit(['bisect', 'reset'], { cwd })
  assert.equal((await labs.verify('bisect', cwd)).completed, true)

  const opened = await labs.create('tags', root)
  assert.equal(opened.reused, true)
  const fresh = await labs.reset('tags', root)
  assert.equal(fresh.reused, false)
  assert.equal((await git.tryGit(['tag', '--list'], fresh.path)).output, '')
  await assert.rejects(labs.create('../outside', root))
})

test('legacy progress migrates without losing challenge completion or saved repository', function (t) {
  const root = workspace()
  t.after(function () { fs.rmSync(root, { recursive: true, force: true }) })
  const dataFile = path.join(root, 'user-data.json')
  fs.writeFileSync(dataFile, JSON.stringify({ get_git: { completed: true }, repository: { completed: false }, merge_tada: { completed: true } }))
  fs.writeFileSync(path.join(root, 'saved-dir.json'), JSON.stringify({ savedDir: 'C:\\class\\practice' }))
  const store = progressStore(dataFile)
  const data = store.get()
  assert.equal(data.challenges.get_git, true)
  assert.equal(data.challenges.merge_tada, true)
  assert.equal(data.challenges.repository, false)
  assert.equal(data.savedRepository, 'C:\\class\\practice')
  store.setCurrentLab('tags', path.join(root, 'MSIT Git Lab', 'tags'), false)
  assert.equal(progressStore(dataFile).get().labs.tags.path, path.join(root, 'MSIT Git Lab', 'tags'))
})

test('checkpoint copy is bilingual and reduced-motion behavior is declared', function () {
  const mergeLesson = lessons.find(function (lesson) { return lesson.id === 'branch-merge' })
  assert.equal(mergeLesson.checkpoint.choices[0].length, 3)
  assert.equal(mergeLesson.checkpoint.choices[1].length, 3)
  assert.ok(mergeLesson.checkpoint.explanation[0])
  assert.ok(mergeLesson.checkpoint.explanation[1])
  const css = fs.readFileSync(path.join(__dirname, '..', 'assets', 'css', 'msit.css'), 'utf8')
  const renderer = fs.readFileSync(path.join(__dirname, '..', 'lib', 'app-renderer.js'), 'utf8')
  assert.match(css, /prefers-reduced-motion:\s*reduce/)
  assert.match(renderer, /prefers-reduced-motion:\s*reduce/)
})

test('learning path runs through the original challenges and finishes in the learner repository', function () {
  const root = path.join(__dirname, '..')
  const english = fs.readFileSync(path.join(root, 'resources', 'contents', 'en-US', 'pages', 'index.html'), 'utf8')
  const german = fs.readFileSync(path.join(root, 'resources', 'contents', 'de-DE', 'pages', 'index.html'), 'utf8')
  const ownRepository = fs.readFileSync(path.join(root, 'resources', 'contents', 'en-US', 'pages', 'own-repository.html'), 'utf8')
  const ownRepositoryGerman = fs.readFileSync(path.join(root, 'resources', 'contents', 'de-DE', 'pages', 'own-repository.html'), 'utf8')
  const challengeLayout = fs.readFileSync(path.join(root, 'resources', 'layouts', 'challenge.hbs'), 'utf8')
  const challengeSidebar = fs.readFileSync(path.join(root, 'resources', 'contents', 'en-US', 'partials', 'chal-sidebar.html'), 'utf8')
  const challengeSidebarGerman = fs.readFileSync(path.join(root, 'resources', 'contents', 'de-DE', 'partials', 'chal-sidebar.html'), 'utf8')
  const challengeBuilder = fs.readFileSync(path.join(root, 'lib', 'build-challenges.js'), 'utf8')
  const challengeHeader = fs.readFileSync(path.join(root, 'resources', 'contents', 'en-US', 'partials', 'chal-header.html'), 'utf8')
  const renderer = fs.readFileSync(path.join(root, 'lib', 'app-renderer.js'), 'utf8')
  const homeRenderer = fs.readFileSync(path.join(root, 'lib', 'home-renderer.js'), 'utf8')
  const commonRenderer = fs.readFileSync(path.join(root, 'lib', 'common-renderer.js'), 'utf8')
  const legacyRenderer = fs.readFileSync(path.join(root, 'lib', 'legacy-renderer.js'), 'utf8')
  const css = fs.readFileSync(path.join(root, 'assets', 'css', 'msit.css'), 'utf8')
  const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8')
  const locale = require('../lib/locale.js')
  const learningPath = require('../lib/learning-path.js')
  const progress = { challenges: {}, labs: {}, savedRepository: null }

  assert.match(english, /<html lang="en-US">/)
  assert.match(english, /href="\.\.\/challenges\/get_git\.html"/)
  assert.doesNotMatch(english, /id="practice"|id="own-repository"|id="lesson-list"/)
  assert.match(german, /href="\.\.\/challenges\/get_git\.html"/)
  assert.doesNotMatch(english, /guided practice/i)
  assert.equal(fs.existsSync(path.join(root, 'resources', 'contents', 'en-US', 'pages', 'practice.html')), false)
  assert.equal(fs.existsSync(path.join(root, 'resources', 'contents', 'de-DE', 'pages', 'practice.html')), false)
  assert.doesNotMatch(challengeLayout, /challenge-breadcrumbs/)
  assert.match(challengeHeader, /class="brand" href="\.\.\/pages\/index\.html" aria-label="MSIT Git Lab home"/)
  assert.doesNotMatch(challengeSidebar, /challenge-section-links/)
  assert.doesNotMatch(challengeSidebarGerman, /challenge-section-links/)
  assert.match(challengeSidebar, /<h3>{{ sectiontitle }}<\/h3>/)
  assert.match(challengeSidebarGerman, /<h3>{{ sectiontitle }}<\/h3>/)
  assert.match(ownRepository, /Original challenges/)
  assert.match(ownRepositoryGerman, /Original-Challenges/)
  assert.match(ownRepository, /id="choose-repository"/)
  assert.match(english, /<html lang="en-US">/)
  assert.equal(locale.getFallbackLocale(), 'en-US')
  assert.match(main, /const language = locale\.getFallbackLocale\(\)/)
  assert.match(main, /getResumeEntry\(language\)/)
  assert.equal(learningPath.totalSteps, 12)
  assert.deepEqual(learningPath.orderedLessons(lessons).map(function (lesson) { return lesson.id }).slice(0, 5), ['stage-commit', 'branch-merge', 'stash', 'remote-workflow', 'tags'])
  assert.deepEqual(learningPath.orderedLessons(lessons).map(function (lesson) { return lesson.id }).slice(5), ['merge-conflict', 'rebase', 'interactive-rebase', 'cherry-pick', 'reset-reflog', 'bisect'])
  assert.deepEqual(learningPath.nextStep(progress, lessons), { type: 'challenge', id: 'get_git' })
  learningPath.challenges.forEach(function (challenge) { progress.challenges[challenge.id] = true })
  assert.deepEqual(learningPath.nextStep(progress, lessons), { type: 'repository', id: 'own-repository' })
  assert.equal(learningPath.completedCount(progress, lessons), 11)
  progress.labs[lessons[0].id] = { completed: true }
  assert.deepEqual(learningPath.nextStep(progress, lessons), { type: 'repository', id: 'own-repository' })
  assert.equal(learningPath.completedCount(progress, lessons), 11)
  progress.savedRepository = 'C:\\class\\project'
  assert.equal(learningPath.completedCount(progress, lessons), 12)
  assert.match(renderer, /const previewMode = !api/)
  assert.match(renderer, /if \(lesson\.id !== activeLesson\.id\) return/)
  assert.match(homeRenderer, /const request = api && typeof api\.getProgress/)
  assert.match(commonRenderer, /if \(!api \|\| typeof api\.openExternal !== 'function'\)/)
  assert.match(legacyRenderer, /nextLink\.getAttribute\('aria-disabled'\) === 'true'/)
  assert.doesNotMatch(legacyRenderer, /itemIndex > nextChallengeIndex/)
  assert.match(css, /\.step-navigation/)
  assert.match(css, /font-family: 'Source Sans Pro'/)
  assert.match(css, /background-image: linear-gradient\(45deg, transparent 50%, #f5f5f0 50%\)/)
  assert.match(css, /\.legacy-challenge \.verify \.btn-white.*background: #f5f5f0; color: #193325/)
  assert.match(challengeBuilder, /nexturl = '\.\.\/pages\/own-repository\.html'/)
  assert.match(css, /\.legacy-challenge \.content \{ width: 100%; margin-left: 0;/)
  assert.match(css, /@media \(max-width: 700px\)/)
})
