(function (root, factory) {
  const curriculum = factory()
  if (typeof module === 'object' && module.exports) module.exports = curriculum
  else root.MSIT_CURRICULUM = curriculum
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const lessons = [
    {
      id: 'stage-commit',
      level: 'Intermediate',
      effect: '',
      checkpoint: {
        question: ['What does `git add` do?', 'Was macht `git add`?'],
        choices: [['Sends a commit to GitHub', 'Stellt Änderungen für den nächsten Commit bereit', 'Creates a branch'], ['Einen Commit zu GitHub senden', 'Änderungen für den nächsten Commit vormerken', 'Einen Branch erstellen']],
        answer: 1,
        explanation: ['It stages selected changes in the index. A commit records that snapshot.', 'Der Befehl legt ausgewählte Änderungen in den Index. Erst der Commit speichert diesen Stand.']
      },
      en: { title: 'Stage and commit with intent', summary: 'Read the working tree, stage only what belongs together, and make a clean commit.', goal: 'Commit the prepared note and leave the repository clean.', steps: ['Inspect the status and diff before changing anything.', 'Stage the note, review the staged diff, then commit it with a useful message.', 'Run status again and confirm there is nothing left to commit.'], hints: ['git status --short', 'git diff', 'git add notes.md', 'git diff --staged', 'git commit -m "Add practice notes"', 'git status'] },
      de: { title: 'Gezielt stagen und committen', summary: 'Sieh dir den Arbeitsstand an, stage zusammengehörige Änderungen und committe sauber.', goal: 'Committe die vorbereitete Notiz und lass das Repository sauber zurück.', steps: ['Prüfe zuerst Status und Änderungen.', 'Stage die Notiz, kontrolliere den gestagten Diff und committe sie mit einer klaren Nachricht.', 'Prüfe den Status erneut. Es sollte nichts mehr zu committen geben.'], hints: ['git status --short', 'git diff', 'git add notes.md', 'git diff --staged', 'git commit -m "Übungsnotizen ergänzen"', 'git status'] },
      files: { 'README.md': '# Git Lab\nA small repository for deliberate staging practice.\n' },
      setup: 'stage'
    },
    {
      id: 'branch-merge',
      level: 'Intermediate',
      effect: 'merge',
      checkpoint: {
        question: ['What makes a fast-forward merge possible?', 'Wann ist ein Fast-Forward-Merge möglich?'],
        choices: [['The target branch is already an ancestor of the branch being merged', 'The branches have no shared history', 'GitHub approves the pull request'], ['Der Ziel-Branch ist bereits ein Vorfahr des gemergten Branches', 'Die Branches haben keine gemeinsame Historie', 'GitHub genehmigt den Pull Request']],
        answer: 0,
        explanation: ['A fast-forward moves the branch pointer when no divergent commit needs combining.', 'Git verschiebt beim Fast-Forward nur den Branch-Zeiger, wenn keine auseinander gelaufenen Commits zusammengeführt werden müssen.']
      },
      en: { title: 'Branches and a clean merge', summary: 'Create an isolated feature branch, make a commit, then merge it into main.', goal: 'Merge the feature branch into main and keep the full history.', steps: ['Create a feature branch from main and add feature.md.', 'Commit the new file on the feature branch.', 'Switch back to main and merge the feature branch.', 'Inspect the graph and confirm main contains the feature commit.'], hints: ['git switch -c feature/summary', 'git add feature.md', 'git commit -m "Add feature summary"', 'git switch main', 'git merge feature/summary', 'git log --oneline --graph --all'] },
      de: { title: 'Branches und sauber mergen', summary: 'Lege einen Feature-Branch an, committe dort eine Änderung und merge sie in main.', goal: 'Merge den Feature-Branch in main und behalte die vollständige Historie.', steps: ['Erstelle aus main den Branch feature/summary und lege feature.md an.', 'Committe die Datei im Feature-Branch.', 'Wechsle zurück zu main und merge den Feature-Branch.', 'Sieh dir den Graphen an und prüfe, ob der Feature-Commit in main steckt.'], hints: ['git switch -c feature/summary', 'git add feature.md', 'git commit -m "Feature-Zusammenfassung ergänzen"', 'git switch main', 'git merge feature/summary', 'git log --oneline --graph --all'] },
      files: { 'README.md': '# Branch practice\nKeep main stable while a feature takes shape.\n' },
      setup: 'branch-merge'
    },
    {
      id: 'merge-conflict',
      level: 'Advanced',
      effect: 'merge',
      en: { title: 'Resolve a real merge conflict', summary: 'Two branches edit the same line. Merge them, choose the final wording, and record the resolution.', goal: 'Finish the merge with a commit and no conflict markers left.', steps: ['Merge feature/welcome into main to produce the conflict.', 'Open greeting.txt and choose wording that keeps both ideas.', 'Remove all conflict markers, stage the file, and commit the merge.', 'Inspect the graph and the final file.'], hints: ['git merge feature/welcome', 'git status', 'git add greeting.txt', 'git commit', 'git log --oneline --graph --all'] },
      de: { title: 'Einen echten Merge-Konflikt lösen', summary: 'Beide Branches ändern dieselbe Zeile. Merge sie, entscheide dich für den finalen Text und committe die Lösung.', goal: 'Schließe den Merge mit einem Commit ab und entferne alle Konfliktmarker.', steps: ['Merge feature/welcome in main. Git meldet den Konflikt.', 'Öffne greeting.txt und formuliere eine Zeile, die beide Ideen aufgreift.', 'Entferne alle Konfliktmarker, stage die Datei und committe den Merge.', 'Prüfe den Graphen und den finalen Dateiinhalt.'], hints: ['git merge feature/welcome', 'git status', 'git add greeting.txt', 'git commit', 'git log --oneline --graph --all'] },
      files: { 'README.md': '# Conflict lab\nPractice resolving the same line changed on two branches.\n', 'greeting.txt': 'Welcome to the Git Lab.\n' },
      setup: 'conflict'
    },
    {
      id: 'rebase',
      level: 'Advanced',
      effect: 'rebase',
      checkpoint: {
        question: ['What does rebase do to feature commits?', 'Was passiert beim Rebase mit den Feature-Commits?'],
        choices: [['It replays them on a new base, creating new commit IDs', 'It deletes them', 'It merges them without changing history'], ['Sie werden auf einer neuen Basis erneut angewendet und erhalten neue IDs', 'Sie werden gelöscht', 'Sie werden gemergt, ohne die Historie zu ändern']],
        answer: 0,
        explanation: ['Rebase rewrites the selected commits on top of another base, so their IDs change.', 'Rebase wendet die ausgewählten Commits auf einer neuen Basis erneut an. Deshalb ändern sich ihre IDs.']
      },
      en: { title: 'Rebase and fast-forward', summary: 'Replay a feature commit on the latest main, then bring it back with a fast-forward.', goal: 'Update the feature branch with rebase and finish with a linear main history.', steps: ['Switch to feature/rebase and replay it on main.', 'Switch to main and fast-forward it to the rebased feature branch.', 'Check the commit graph for a straight line and no merge commit.'], hints: ['git switch feature/rebase', 'git rebase main', 'git switch main', 'git merge --ff-only feature/rebase', 'git log --oneline --graph --all'] },
      de: { title: 'Rebasen und per Fast-Forward übernehmen', summary: 'Wende einen Feature-Commit auf dem aktuellen main erneut an und übernimm ihn per Fast-Forward.', goal: 'Aktualisiere den Feature-Branch mit Rebase und erhalte eine lineare main-Historie.', steps: ['Wechsle zu feature/rebase und setze ihn auf main neu auf.', 'Wechsle zu main und führe einen Fast-Forward zum rebasierten Branch aus.', 'Prüfe im Commit-Graphen, dass die Historie gerade verläuft und keinen Merge-Commit enthält.'], hints: ['git switch feature/rebase', 'git rebase main', 'git switch main', 'git merge --ff-only feature/rebase', 'git log --oneline --graph --all'] },
      files: { 'README.md': '# Rebase lab\nThe main branch advances while a feature is in progress.\n' },
      setup: 'rebase'
    },
    {
      id: 'interactive-rebase',
      level: 'Advanced',
      effect: 'rebase',
      en: { title: 'Clean up commits with interactive rebase', summary: 'Use the rebase todo list to combine three small commits into one clear change.', goal: 'Squash the three feature commits into one commit without losing their file changes.', steps: ['Inspect the three commits on feature/docs.', 'Start an interactive rebase for the last three commits.', 'Keep the first commit and squash the next two into it. Edit the final message.', 'Verify the branch now has one feature commit and all three files are present.', 'If something goes wrong, use `git rebase --abort` before trying again.'], hints: ['git switch feature/docs', 'git log --oneline -3', 'git rebase -i HEAD~3', 'git log --oneline -4', 'git status'] },
      de: { title: 'Commits mit interaktivem Rebase aufräumen', summary: 'Fasse drei kleine Commits über die Rebase-To-do-Liste zu einer klaren Änderung zusammen.', goal: 'Fasse die drei Feature-Commits zu einem Commit zusammen, ohne Dateien zu verlieren.', steps: ['Sieh dir die drei Commits in feature/docs an.', 'Starte einen interaktiven Rebase für die letzten drei Commits.', 'Lass den ersten Commit stehen und fasse die nächsten beiden mit ihm zusammen. Passe die Nachricht an.', 'Prüfe, ob der Branch jetzt einen Feature-Commit und weiterhin alle drei Dateien hat.', 'Falls etwas schiefgeht, brich mit `git rebase --abort` ab und versuch es erneut.'], hints: ['git switch feature/docs', 'git log --oneline -3', 'git rebase -i HEAD~3', 'git log --oneline -4', 'git status'] },
      files: { 'README.md': '# Interactive rebase lab\nThe feature branch has three tiny documentation commits.\n' },
      setup: 'interactive-rebase'
    },
    {
      id: 'stash',
      level: 'Intermediate',
      en: { title: 'Stash and restore unfinished work', summary: 'Put tracked and untracked work aside, then bring it back safely.', goal: 'Restore both edits and the new file, then leave no stash entry behind.', steps: ['Inspect the modified file and the untracked draft.', 'Stash both kinds of change with a message.', 'Confirm the working tree is clean.', 'Restore the stash, inspect the changes, and drop the entry once it is safely back.'], hints: ['git stash push -u -m "draft work"', 'git status', 'git stash list', 'git stash pop', 'git status'] },
      de: { title: 'Unfertige Arbeit stashen und zurückholen', summary: 'Leg getrackte und neue Änderungen kurz beiseite und hol sie danach sicher zurück.', goal: 'Stelle beide Änderungen wieder her und lass keinen Stash-Eintrag zurück.', steps: ['Prüfe die geänderte Datei und den neuen Entwurf.', 'Stashe beide Arten von Änderungen mit einer Nachricht.', 'Prüfe, ob das Arbeitsverzeichnis sauber ist.', 'Hole den Stash zurück, kontrolliere die Änderungen und entferne den Eintrag, sobald alles wieder da ist.'], hints: ['git stash push -u -m "Entwurf"', 'git status', 'git stash list', 'git stash pop', 'git status'] },
      files: { 'README.md': '# Stash lab\nA tracked file for practicing stash.\n' },
      setup: 'stash'
    },
    {
      id: 'cherry-pick',
      level: 'Advanced',
      en: { title: 'Cherry-pick one focused change', summary: 'Bring a single commit from a topic branch onto main without merging the whole branch.', goal: 'Apply the prepared fix commit to main and verify the change.', steps: ['Inspect the topic/fix commit and note its short hash.', 'Cherry-pick that commit while on main.', 'Confirm the file is present and the new commit is on main.'], hints: ['git log --oneline --all --decorate', 'git cherry-pick <commit>', 'git show --stat --oneline HEAD', 'git status'] },
      de: { title: 'Eine gezielte Änderung cherry-picken', summary: 'Übernimm einen einzelnen Commit aus einem Topic-Branch, ohne den ganzen Branch zu mergen.', goal: 'Wende den vorbereiteten Fix auf main an und prüfe die Änderung.', steps: ['Sieh dir den Commit in topic/fix an und notiere den kurzen Hash.', 'Cherry-picke den Commit, während du auf main bist.', 'Prüfe, ob die Datei vorhanden ist und der neue Commit auf main liegt.'], hints: ['git log --oneline --all --decorate', 'git cherry-pick <commit>', 'git show --stat --oneline HEAD', 'git status'] },
      files: { 'README.md': '# Cherry-pick lab\nBring a focused fix across branches.\n' },
      setup: 'cherry-pick'
    },
    {
      id: 'remote-workflow',
      level: 'Intermediate',
      followupLegacyId: 'requesting_you_pull_please',
      en: { title: 'Push a branch and review it like a pull request', summary: 'Use a local remote to push a feature branch, fetch it and inspect the proposed changes.', goal: 'Publish feature/request-review to the practice remote and review its diff against main.', steps: ['Inspect the origin remote and the branches it contains.', 'Switch to feature/request-review and push it with upstream tracking.', 'Fetch origin and review the diff between origin/main and your feature branch.', 'Return to main and verify your pushed branch. For a live GitHub pull request, continue with original challenge 10.'], hints: ['git remote -v', 'git switch feature/request-review', 'git push -u origin feature/request-review', 'git fetch origin', 'git diff --stat origin/main...origin/feature/request-review', 'git switch main'] },
      de: { title: 'Einen Branch pushen und wie einen Pull Request prüfen', summary: 'Push einen Feature-Branch zu einem lokalen Remote, hol den Stand ab und sieh dir die vorgeschlagenen Änderungen an.', goal: 'Veröffentliche feature/request-review auf dem Übungs-Remote und prüfe den Diff gegen main.', steps: ['Prüfe das origin-Remote und die Branches dort.', 'Wechsle zu feature/request-review und pushe den Branch mit Upstream-Verknüpfung.', 'Hole den Remote-Stand und prüfe den Diff zwischen origin/main und deinem Feature-Branch.', 'Wechsle zurück zu main und prüfe deinen gepushten Branch. Einen echten GitHub-Pull-Request machst du in der originalen Challenge 10.'], hints: ['git remote -v', 'git switch feature/request-review', 'git push -u origin feature/request-review', 'git fetch origin', 'git diff --stat origin/main...origin/feature/request-review', 'git switch main'] },
      files: { 'README.md': '# Remote workflow lab\nPush a feature branch and inspect its proposed changes.\n' },
      setup: 'remote'
    },
    {
      id: 'reset-reflog',
      level: 'Advanced',
      en: { title: 'Recover a commit with reflog', summary: 'Move a disposable lab branch back, then find the lost commit in the reflog and restore it.', goal: 'Recover the intentionally removed commit and restore its file.', steps: ['Read the latest commits and note the bad commit hash.', 'Use `git reset --hard HEAD~1` to move this lab branch back one commit.', 'Inspect the reflog, find the removed commit, and cherry-pick it to restore the work.', 'Verify the recovery commit and recovered file.'], hints: ['git log --oneline -3', 'git reset --hard HEAD~1', 'git reflog --oneline', 'git cherry-pick <lost-commit-hash>', 'git log --oneline -4'], warning: 'This history-rewriting exercise is restricted to this generated lab repository. Never run the reset step in a repository with work you need.' },
      de: { title: 'Einen Commit mit reflog wiederherstellen', summary: 'Setz einen wegwerfbaren Lab-Branch zurück, finde den vermeintlich verlorenen Commit im Reflog und hol ihn zurück.', goal: 'Stelle den absichtlich entfernten Commit und seine Datei wieder her.', steps: ['Sieh dir die letzten Commits an und notiere den Hash des letzten Commits.', 'Setze diesen Lab-Branch mit `git reset --hard HEAD~1` einen Commit zurück.', 'Durchsuche das Reflog, finde den entfernten Commit und cherry-picke ihn zurück.', 'Prüfe den wiederhergestellten Commit und die Datei.'], hints: ['git log --oneline -3', 'git reset --hard HEAD~1', 'git reflog --oneline', 'git cherry-pick <Hash-des-verlorenen-Commits>', 'git log --oneline -4'], warning: 'Diese Übung schreibt die Historie um und läuft nur in diesem erzeugten Lab-Repository. Führe den Reset nie in einem Repository mit wichtigen Änderungen aus.' },
      files: { 'README.md': '# Reflog recovery lab\nThis generated repository is safe to reset and recover.\n' },
      setup: 'reset-reflog'
    },
    {
      id: 'tags',
      level: 'Intermediate',
      checkpoint: {
        question: ['What is the key difference between an annotated tag and a lightweight tag?', 'Was ist der wichtigste Unterschied zwischen einem annotierten und einem Lightweight-Tag?'],
        choices: [['Annotated tags include tagger, date, message, and can be signed', 'Lightweight tags cannot point to commits', 'There is no difference'], ['Annotierte Tags enthalten Tagger, Datum und Nachricht und können signiert werden', 'Lightweight-Tags können nicht auf Commits zeigen', 'Es gibt keinen Unterschied']],
        answer: 0,
        explanation: ['An annotated tag is a full Git object with metadata; a lightweight tag is just a ref to an object.', 'Ein annotierter Tag ist ein eigenes Git-Objekt mit Metadaten. Ein Lightweight-Tag ist nur ein Verweis auf ein Objekt.']
      },
      en: { title: 'Mark a release with an annotated tag', summary: 'Create a version tag with a message, inspect it, and remove it safely if you made a typo.', goal: 'Create the annotated tag v1.0.0 on the current commit.', steps: ['Inspect the commit you want to mark.', 'Create an annotated tag with a meaningful message.', 'Inspect the tag object and confirm it points to the expected commit.'], hints: ['git log -1 --oneline', 'git tag -a v1.0.0 -m "First practice release"', 'git show --no-patch v1.0.0', 'git tag -n'] },
      de: { title: 'Ein Release mit annotiertem Tag markieren', summary: 'Lege einen Versionstag mit Nachricht an, prüfe ihn und entferne ihn sicher, falls du dich vertippt hast.', goal: 'Erstelle den annotierten Tag v1.0.0 für den aktuellen Commit.', steps: ['Prüfe den Commit, den du markieren willst.', 'Erstelle einen annotierten Tag mit einer aussagekräftigen Nachricht.', 'Sieh dir das Tag-Objekt an und prüfe, ob es auf den richtigen Commit zeigt.'], hints: ['git log -1 --oneline', 'git tag -a v1.0.0 -m "Erstes Übungsrelease"', 'git show --no-patch v1.0.0', 'git tag -n'] },
      files: { 'README.md': '# Release tagging lab\nA small snapshot to mark as a release.\n' },
      setup: 'tags'
    },
    {
      id: 'bisect',
      level: 'Advanced',
      en: { title: 'Find a regression with bisect', summary: 'Use binary search over commit history to find the first commit that introduced a bug.', goal: 'Identify and tag the first bad commit, then exit bisect and return to main.', steps: ['Start bisect and mark the current commit bad.', 'Mark `HEAD~3` good. This narrows the search range.', 'Inspect `feature.flag` at each revision and mark it good or bad.', 'When Git prints the first bad commit hash, tag that hash with `bisect-found`.', 'Run bisect reset and verify the repository is back on main.'], hints: ['git bisect start', 'git bisect bad', 'git bisect good HEAD~3', 'git show HEAD:feature.flag', 'git bisect good  # or git bisect bad', 'git tag bisect-found <first-bad-commit-hash>', 'git bisect reset', 'git status'] },
      de: { title: 'Eine Regression mit bisect finden', summary: 'Durchsuche die Commit-Historie per Halbierung, um den ersten Commit mit einem Bug zu finden.', goal: 'Finde und tagge den ersten fehlerhaften Commit, beende bisect und kehre zu main zurück.', steps: ['Starte bisect und markiere den aktuellen Commit als fehlerhaft.', 'Markiere `HEAD~3` als gut. Damit grenzt du die Suche ein.', 'Prüfe `feature.flag` in jedem Stand und markiere ihn als gut oder fehlerhaft.', 'Wenn Git den Hash des ersten fehlerhaften Commits ausgibt, versehe genau diesen Commit mit dem Tag `bisect-found`.', 'Führe bisect reset aus und prüfe, ob du wieder auf main bist.'], hints: ['git bisect start', 'git bisect bad', 'git bisect good HEAD~3', 'git show HEAD:feature.flag', 'git bisect good  # oder git bisect bad', 'git tag bisect-found <Hash-des-ersten-fehlerhaften-Commits>', 'git bisect reset', 'git status'] },
      files: { 'README.md': '# Bisect lab\nUse Git to pinpoint when a tiny feature stopped working.\n' },
      setup: 'bisect'
    }
  ]
  return { lessons }
})
