const fs = require('fs')
const path = require('path')

;['built', 'out'].forEach(function (directory) {
  fs.rmSync(path.join(__dirname, '..', directory), { recursive: true, force: true })
})
