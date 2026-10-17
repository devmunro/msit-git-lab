const fs = require('fs')
const path = require('path')
const git = require('./git-service.js')
const lessons = require('./curriculum.js').lessons
const byId = {}
lessons.forEach(function (lesson) { byId[lesson.id] = lesson })

function labPath (documentsPath, labId) {
  if (!byId[labId]) throw new Error('Unknown practice lab.')
  return path.resolve(documentsPath, 'MSIT Git Lab', labId)
}

function ensureSafePath (documentsPath, target) {
  const root = path.resolve(documentsPath, 'MSIT Git Lab')
  const resolved = path.resolve(target)
  if (path.dirname(resolved) !== root || !path.basename(resolved)) throw new Error('The lab folder is outside the managed practice area.')
  if (fs.existsSync(root)) {
    const rootStat = fs.lstatSync(root)
    if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) throw new Error('The managed practice folder is not a regular directory.')
  }
  return resolved
}

async function create (labId, documentsPath) {
  const target = ensureSafePath(documentsPath, labPath(documentsPath, labId))
  if (fs.existsSync(target)) {
    const stat = fs.lstatSync(target)
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('The practice folder is not a regular directory.')
    return { path: target, reused: true }
  }
  fs.mkdirSync(target, { recursive: true })
  try {
    await git.runGit(['init', '-b', 'main'], { cwd: target })
    await git.runGit(['config', 'user.name', 'MSIT Git Lab Learner'], { cwd: target })
    await git.runGit(['config', 'user.email', 'learner@msit-git-lab.invalid'], { cwd: target })
    await writeFiles(target, byId[labId].files)
    await commit(target, 'Create practice repository')
    await setupScenario(target, byId[labId].setup)
    return { path: target, reused: false }
  } catch (error) {
    fs.rmSync(target, { recursive: true, force: true })
    throw error
  }
}

async function reset (labId, documentsPath) {
  const target = ensureSafePath(documentsPath, labPath(documentsPath, labId))
  if (fs.existsSync(target)) {
    const stat = fs.lstatSync(target)
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('The practice folder is not a regular directory.')
    fs.rmSync(target, { recursive: true, force: true })
  }
  return create(labId, documentsPath)
}

async function writeFiles (cwd, files) {
  Object.keys(files).forEach(function (name) {
    const destination = path.join(cwd, name)
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.writeFileSync(destination, files[name], 'utf8')
  })
}

async function commit (cwd, message) {
  await git.runGit(['add', '--all'], { cwd })
  await git.runGit(['commit', '-m', message], { cwd })
}

async function setupScenario (cwd, scenario) {
  if (scenario === 'stage') return writeFiles(cwd, { 'notes.md': 'Write one sentence about what belongs in this commit.\n' })
  if (scenario === 'branch-merge') return
  if (scenario === 'conflict') {
    await git.runGit(['switch', '-c', 'feature/welcome'], { cwd })
    fs.writeFileSync(path.join(cwd, 'greeting.txt'), 'Welcome to the Git Lab. Bring a friend along.\n')
    await commit(cwd, 'Add a friendly welcome')
    await git.runGit(['switch', 'main'], { cwd })
    fs.writeFileSync(path.join(cwd, 'greeting.txt'), 'Welcome to the Git Lab. Pick a project to explore.\n')
    await commit(cwd, 'Add a project suggestion')
    return
  }
  if (scenario === 'rebase') {
    await git.runGit(['switch', '-c', 'feature/rebase'], { cwd })
    fs.writeFileSync(path.join(cwd, 'feature.txt'), 'A focused feature change.\n')
    await commit(cwd, 'Add a focused feature')
    await git.runGit(['switch', 'main'], { cwd })
    fs.writeFileSync(path.join(cwd, 'release-note.txt'), 'Main advanced while the feature was in progress.\n')
    await commit(cwd, 'Advance main')
    return
  }
  if (scenario === 'interactive-rebase') {
    await git.runGit(['switch', '-c', 'feature/docs'], { cwd })
    for (let i = 1; i <= 3; i++) {
      fs.writeFileSync(path.join(cwd, 'guide-' + i + '.md'), '# Guide ' + i + '\nSmall documentation improvement ' + i + '.\n')
      await commit(cwd, 'Document step ' + i)
    }
    return
  }
  if (scenario === 'stash') {
    fs.writeFileSync(path.join(cwd, 'README.md'), '# Stash lab\nThis tracked file has unfinished edits.\n')
    fs.writeFileSync(path.join(cwd, 'draft.txt'), 'A new untracked draft.\n')
    return
  }
  if (scenario === 'cherry-pick') {
    await git.runGit(['switch', '-c', 'topic/fix'], { cwd })
    fs.writeFileSync(path.join(cwd, 'bugfix.txt'), 'The focused fix is now available.\n')
    await commit(cwd, 'Fix a focused issue')
    await git.runGit(['switch', 'main'], { cwd })
    return
  }
  if (scenario === 'remote') {
    const remotePath = path.join(cwd, '.msit-origin.git')
    await git.runGit(['init', '--bare', remotePath], { cwd })
    fs.appendFileSync(path.join(cwd, '.git', 'info', 'exclude'), '\n.msit-origin.git/\n')
    await git.runGit(['remote', 'add', 'origin', '.msit-origin.git'], { cwd })
    await git.runGit(['push', '-u', 'origin', 'main'], { cwd })
    await git.runGit(['switch', '-c', 'feature/request-review'], { cwd })
    fs.writeFileSync(path.join(cwd, 'review-note.md'), 'A proposed change ready for review.\n')
    await commit(cwd, 'Prepare a reviewable feature')
    await git.runGit(['switch', 'main'], { cwd })
    return
  }
  if (scenario === 'reset-reflog') {
    fs.writeFileSync(path.join(cwd, 'safe-change.txt'), 'Keep this change after recovery.\n')
    await commit(cwd, 'Add recoverable work')
    fs.writeFileSync(path.join(cwd, 'mistake.txt'), 'This commit will be reset, then recovered.\n')
    await commit(cwd, 'Add a practice mistake')
    return
  }
  if (scenario === 'tags') return
  if (scenario === 'bisect') {
    fs.writeFileSync(path.join(cwd, 'feature.flag'), 'stable\n')
    await commit(cwd, 'Confirm stable behavior')
    fs.writeFileSync(path.join(cwd, 'feature.flag'), 'broken\n')
    await commit(cwd, 'BUG introduced: feature breaks')
    fs.writeFileSync(path.join(cwd, 'README.md'), '# Bisect lab\nUse Git to pinpoint when a tiny feature stopped working.\nMore history after the regression.\n')
    await commit(cwd, 'Add notes after the regression')
  }
}

async function verify (labId, repositoryPath) {
  const lesson = byId[labId]
  if (!lesson) throw new Error('Unknown practice lab.')
  if (!repositoryPath || typeof repositoryPath !== 'string') return { completed: false, message: 'Choose or create this practice repository first.' }
  const root = await git.tryGit(['rev-parse', '--show-toplevel'], repositoryPath)
  if (!root.ok || fs.realpathSync.native(root.output) !== fs.realpathSync.native(repositoryPath)) return { completed: false, message: 'This is not the generated repository for this lab.' }
  const result = await verifyScenario(repositoryPath, lesson.setup)
  return { completed: result.completed, message: result.message }
}

async function verifyScenario (cwd, scenario) {
  const status = await git.tryGit(['status', '--porcelain'], cwd)
  const branch = await git.tryGit(['branch', '--show-current'], cwd)
  const log = await git.tryGit(['log', '--format=%s', '--all'], cwd)
  const trackedFile = function (file) { return git.tryGit(['ls-files', '--error-unmatch', file], cwd) }
  if (scenario === 'stage') {
    const staged = await trackedFile('notes.md')
    return { completed: status.ok && status.output === '' && staged.ok && log.output.split('\n').length >= 2, message: 'Stage and commit notes.md, then make sure the working tree is clean.' }
  }
  if (scenario === 'branch-merge') {
    const mergedFeature = await git.tryGit(['merge-base', '--is-ancestor', 'feature/summary', 'main'], cwd)
    const feature = await trackedFile('feature.md')
    return { completed: branch.output === 'main' && mergedFeature.ok && feature.ok, message: 'Create feature/summary, commit feature.md, and merge it into main.' }
  }
  if (scenario === 'conflict') {
    const mergeCommit = await git.tryGit(['rev-list', '--min-parents=2', '-n', '1', 'main'], cwd)
    const conflictText = fs.readFileSync(path.join(cwd, 'greeting.txt'), 'utf8')
    return { completed: branch.output === 'main' && mergeCommit.ok && Boolean(mergeCommit.output) && !/^(<<<<<<<|=======|>>>>>>>)/m.test(conflictText) && status.output === '', message: 'Resolve greeting.txt, stage it, and commit the merge.' }
  }
  if (scenario === 'rebase') {
    const featureIsAncestor = await git.tryGit(['merge-base', '--is-ancestor', 'feature/rebase', 'main'], cwd)
    const mergeCount = await git.tryGit(['rev-list', '--merges', '--count', 'main'], cwd)
    return { completed: branch.output === 'main' && featureIsAncestor.ok && mergeCount.output === '0', message: 'Rebase feature/rebase onto main, then fast-forward main.' }
  }
  if (scenario === 'interactive-rebase') {
    const docs = await git.tryGit(['ls-files', 'guide-1.md', 'guide-2.md', 'guide-3.md'], cwd)
    const mainBase = await git.tryGit(['rev-list', '--count', 'main..feature/docs'], cwd)
    return { completed: branch.output === 'feature/docs' && docs.output.split('\n').length === 3 && mainBase.output === '1' && status.output === '', message: 'Squash the three feature commits into one and keep all three guide files.' }
  }
  if (scenario === 'stash') {
    const file = fs.readFileSync(path.join(cwd, 'README.md'), 'utf8')
    const draft = fs.existsSync(path.join(cwd, 'draft.txt')) && fs.readFileSync(path.join(cwd, 'draft.txt'), 'utf8')
    const stashList = await git.tryGit(['stash', 'list'], cwd)
    const hasTrackedEdit = /^M README\.md/m.test(status.output)
    const hasUntrackedDraft = /^\?\? draft\.txt/m.test(status.output)
    return { completed: status.ok && hasTrackedEdit && hasUntrackedDraft && file.indexOf('unfinished edits') !== -1 && Boolean(draft) && stashList.output === '', message: 'Stash both changes, restore them, and remove the stash entry.' }
  }
  if (scenario === 'cherry-pick') {
    const cherryFile = await trackedFile('bugfix.txt')
    const cherryTitle = await git.tryGit(['log', '-1', '--format=%s', 'main'], cwd)
    return { completed: branch.output === 'main' && cherryFile.ok && cherryTitle.output === 'Fix a focused issue', message: 'Cherry-pick the fix commit from topic/fix onto main.' }
  }
  if (scenario === 'remote') {
    const pushed = await git.tryGit(['ls-remote', '--exit-code', '--heads', 'origin', 'refs/heads/feature/request-review'], cwd)
    const localFeature = await git.tryGit(['rev-parse', 'feature/request-review'], cwd)
    const remoteHash = pushed.ok && pushed.output.split(/\s+/)[0]
    const reviewFile = await git.tryGit(['show', 'feature/request-review:review-note.md'], cwd)
    return { completed: branch.output === 'main' && status.output === '' && pushed.ok && localFeature.output === remoteHash && reviewFile.ok, message: 'Push feature/request-review to origin and review it against origin/main.' }
  }
  if (scenario === 'reset-reflog') {
    const recovered = await git.tryGit(['log', '--format=%s', '--all'], cwd)
    const recoveredFile = await trackedFile('mistake.txt')
    const historyFile = await trackedFile('safe-change.txt')
    return { completed: branch.output === 'main' && recoveredFile.ok && historyFile.ok && /Add a practice mistake/.test(recovered.output), message: 'Reset one commit, find it in reflog, and cherry-pick it back.' }
  }
  if (scenario === 'tags') {
    const tagObject = await git.tryGit(['cat-file', '-t', 'v1.0.0'], cwd)
    const tagTarget = await git.tryGit(['rev-parse', 'v1.0.0^{}'], cwd)
    const head = await git.tryGit(['rev-parse', 'HEAD'], cwd)
    return { completed: tagObject.output === 'tag' && tagTarget.ok && tagTarget.output === head.output, message: 'Create an annotated v1.0.0 tag on the current commit.' }
  }
  if (scenario === 'bisect') {
    const bisectActive = fs.existsSync(path.join(cwd, '.git', 'BISECT_START'))
    const onMain = branch.output === 'main'
    const good = await git.tryGit(['show', 'HEAD:feature.flag'], cwd)
    const taggedBad = await git.tryGit(['log', '-1', '--format=%s', 'bisect-found'], cwd)
    return { completed: onMain && !bisectActive && good.ok && good.output === 'broken' && taggedBad.output === 'BUG introduced: feature breaks', message: 'Find the first bad commit with bisect, tag it bisect-found, and run bisect reset.' }
  }
  return { completed: false, message: 'This practice lab does not have a verifier yet.' }
}

module.exports = { create, reset, verify, labPath, lessonIds: Object.keys(byId) }
