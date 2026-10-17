// create a git repository

const exec = require('child_process').exec
const tmpDir = ''

makeDirectory()

function makeDirectory () {

}

exec('git init', { cwd: tmpDir }, function initalized (err, stderr, stdout) {
  if (err) return console.log(err)
})
