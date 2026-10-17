const path = require('path')

const windowsCertificate = process.env.WINDOWS_CERTIFICATE_FILE
const appleIdentity = process.env.APPLE_DEVELOPER_IDENTITY
const appleId = process.env.APPLE_ID
const applePassword = process.env.APPLE_APP_SPECIFIC_PASSWORD
const appleTeam = process.env.APPLE_TEAM_ID

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: 'msit-git-lab',
    icon: path.join(__dirname, 'assets', 'masterschool-app-icon'),
    osxUniversal: true,
    osxSign: appleIdentity ? { identity: appleIdentity } : undefined,
    osxNotarize: appleId && applePassword && appleTeam
      ? { appleId, appleIdPassword: applePassword, teamId: appleTeam }
      : undefined,
    ignore: [/^\/out\//, /^\/assets\/PortableGit\//, /^\/tests\//]
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        name: 'MSITGitLab',
        authors: 'MSIT',
        description: 'Practice Git and GitHub with MSIT Git Lab',
        setupIcon: path.join(__dirname, 'assets', 'masterschool-app-icon.ico'),
        certificateFile: windowsCertificate,
        certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD
      }
    }
  ]
}
