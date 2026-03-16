#!/usr/bin/env node

var path = require('path')
var exec = require(path.join(__dirname, '../../lib/spawn-git.js'))
var helper = require(path.join(__dirname, '../../lib/helpers.js'))
var userData = require(path.join(__dirname, '../../lib/user-data.js'))

var user = ''

var addToList = helper.addToList
var markChallengeCompleted = helper.markChallengeCompleted

var currentChallenge = 'githubbin'

var total = 3
var counter = 0

// verify they set up git config
// verify that user exists on GitHub (not case sensitve)
// compare the two to make sure cases match

module.exports = function verifyGitHubbinChallenge () {
  counter = 0

  exec('config user.username', function (err, stdout, stderr) {
    if (err) {
      // TODO Catch 'Command failed: /bin/sh -c git config user.username'
      addToList('Error: ' + err.message, false)
      return helper.challengeIncomplete()
    }
    user = stdout.trim()
    if (user === '') {
      addToList('No username found.', false)
      helper.challengeIncomplete()
    } else {
      counter++
      addToList('Username added to Git config!', true)
      checkGitHub(user)
    }
  })

  function checkGitHub (user) {
    var options = {
      headers: { 'User-Agent': 'MasterSchool-Git-it' }
    }

    fetch('https://api.github.com/users/' + user, options)
      .then(function (response) {
        if (response.status === 200) {
          return response.json().then(function (body) {
            counter++
            addToList("You're on GitHub!", true)
            checkCapitals(body.login, user)
          })
        } else if (response.status === 404) {
          helper.challengeIncomplete()
          addToList("GitHub account matching Git config\nusername wasn't found.", false)
        } else {
          addToList('Error: ' + response.statusText, false)
          helper.challengeIncomplete()
        }
      })
      .catch(function (error) {
        addToList('Error: ' + error.message, false)
        helper.challengeIncomplete()
      })
  }

  function checkCapitals (githubUsername, configUsername) {
    if (configUsername.match(githubUsername)) {
      counter++
      addToList('Username same on GitHub and\nGit config!', true)
    } else {
      addToList('GitHub & Git config usernames\ndo not match.', false)
      helper.challengeIncomplete()
    }
    if (counter === total) {
      markChallengeCompleted(currentChallenge)
      userData.updateData(currentChallenge)
    }
  }
}
