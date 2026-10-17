const git = require('./git-service.js')

const legacyIds = [
  'get_git', 'repository', 'commit_to_it', 'githubbin', 'remote_control', 'forks_and_clones',
  'branches_arent_just_for_birds', 'its_a_small_world', 'pull_never_out_of_date',
  'requesting_you_pull_please', 'merge_tada'
]

async function verify (lessonId, repositoryPath) {
  if (legacyIds.indexOf(lessonId) === -1) throw new Error('Unknown original challenge.')
  let checks = []
  if (lessonId === 'get_git') {
    const diagnosis = await git.diagnose()
    checks.push({ passed: diagnosis.installed && diagnosis.supported, message: diagnosis.version || 'Git is not installed or is too old.' })
    checks.push({ passed: diagnosis.userNameConfigured, message: 'Configure your global Git user.name.' })
    checks.push({ passed: diagnosis.userEmailConfigured, message: 'Configure your global Git user.email.' })
  } else {
    if (!repositoryPath) return { completed: false, checks: [{ passed: false, message: 'Choose the repository you used for this challenge.' }] }
    const inside = await git.tryGit(['rev-parse', '--is-inside-work-tree'], repositoryPath)
    if (!inside.ok || inside.output !== 'true') return { completed: false, checks: [{ passed: false, message: 'This folder is not a Git repository.' }] }
    checks = await repositoryChecks(lessonId, repositoryPath)
  }
  return { completed: checks.length > 0 && checks.every(function (check) { return check.passed }), checks }
}

async function repositoryChecks (lessonId, cwd) {
  const checks = []
  const run = function (args) { return git.tryGit(args, cwd) }
  if (lessonId === 'repository') {
    checks.push(await check(run, ['rev-parse', '--is-inside-work-tree'], 'Repository is initialized.'))
  } else if (lessonId === 'commit_to_it') {
    const commits = await run(['rev-list', '--count', 'HEAD'])
    checks.push({ passed: commits.ok && Number(commits.output) >= 2, message: 'Make at least one commit after the initial repository commit.' })
  } else if (lessonId === 'githubbin') {
    const username = await git.tryGit(['config', '--global', '--get', 'user.username'])
    checks.push({ passed: username.ok && /^[A-Za-z0-9-]+$/.test(username.output), message: 'Set a GitHub username with `git config --global user.username YOUR-NAME`.' })
  } else if (lessonId === 'remote_control') {
    const origin = await run(['remote', 'get-url', 'origin'])
    checks.push({ passed: origin.ok && /github\.com[:/]\S+/.test(origin.output), message: 'Add a GitHub origin remote to this repository.' })
    const pushed = await run(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'])
    checks.push({ passed: pushed.ok, message: 'Push a branch and set its upstream remote.' })
  } else if (lessonId === 'forks_and_clones') {
    const originUrl = await run(['remote', 'get-url', 'origin'])
    const upstreamUrl = await run(['remote', 'get-url', 'upstream'])
    checks.push({ passed: originUrl.ok && /github\.com[:/]/.test(originUrl.output), message: 'Set origin to your GitHub fork.' })
    checks.push({ passed: upstreamUrl.ok && /github\.com[:/]jlord\/patchwork(?:\.git)?$/.test(upstreamUrl.output), message: 'Add jlord/patchwork as the upstream remote.' })
  } else if (lessonId === 'branches_arent_just_for_birds') {
    const branches = await run(['branch', '--list'])
    checks.push({ passed: branches.ok && branches.output.split('\n').filter(Boolean).length > 1, message: 'Create and switch to a new branch.' })
  } else if (lessonId === 'its_a_small_world') {
    const remotes = await run(['remote', '-v'])
    checks.push({ passed: remotes.ok && /origin\s/.test(remotes.output), message: 'Connect this local repository to a remote.' })
  } else if (lessonId === 'pull_never_out_of_date') {
    const upstream = await run(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'])
    const counts = upstream.ok ? await run(['rev-list', '--left-right', '--count', 'HEAD...@{upstream}']) : { ok: false }
    const status = await run(['status', '--porcelain'])
    const sides = counts.ok ? counts.output.split(/\s+/).map(Number) : []
    checks.push({ passed: upstream.ok, message: 'Set an upstream branch for the branch you are updating.' })
    checks.push({ passed: counts.ok && sides[0] === 0 && sides[1] === 0 && status.ok && status.output === '', message: 'Pull remote changes and leave your branch up to date with a clean working tree.' })
  } else if (lessonId === 'requesting_you_pull_please') {
    const head = await run(['rev-parse', '--abbrev-ref', 'HEAD'])
    const branchRemote = await run(['config', '--get', 'branch.' + head.output + '.remote'])
    checks.push({ passed: branchRemote.ok, message: 'Push your topic branch to GitHub before opening a pull request.' })
  } else if (lessonId === 'merge_tada') {
    const merges = await run(['rev-list', '--merges', '--count', 'HEAD'])
    checks.push({ passed: merges.ok && Number(merges.output) > 0, message: 'Complete a merge commit in this repository.' })
  }
  return checks
}

async function check (run, args, message) {
  const result = await run(args)
  return { passed: result.ok && result.output === 'true', message }
}

module.exports = { verify, lessonIds: legacyIds }
