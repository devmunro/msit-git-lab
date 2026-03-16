#!/usr/bin/env node

var path = require('path')
var exec = require(path.join(__dirname, '../../lib/spawn-git.js'))
var helper = require(path.join(__dirname, '../../lib/helpers.js'))
var userData = require(path.join(__dirname, '../../lib/user-data.js'))

var addToList = helper.addToList
var markChallengeCompleted = helper.markChallengeCompleted

var currentChallenge = 'requesting_you_pull_please'
var url = 'http://reporobot.jlord.us/pr?username='

// check that they've submitted a pull request
// to the original repository jlord/patchwork

module.exports = function verifyPRChallenge () {
  exec('config user.username', function (err, stdout, stdrr) {
    if (err) {
      addToList('Error: ' + err.message, false)
      return helper.challengeIncomplete()
    }
    var username = stdout.trim()
    pullrequest(username)
  })

  function pullrequest (username) {
    fetch(url + username)
      .then(function (response) {
        if (response.status === 200) {
          return response.json().then(function (body) {
            var pr = body.pr
            if (pr) {
              addToList('Found your pull request!', true)
              markChallengeCompleted(currentChallenge)
              userData.updateData(currentChallenge)
            } else {
              addToList('No merged pull request found for ' + username +
                '. If you did make a pull request, return to ' +
                'its website to see comments.', false)
              helper.challengeIncomplete()
            }
          })
        } else {
          addToList('Error: ' + response.statusText, false)
          helper.challengeIncomplete()
        }
      })
      .catch(function (err) {
        addToList('Error: ' + err.message, false)
        helper.challengeIncomplete()
      })
  }
}
