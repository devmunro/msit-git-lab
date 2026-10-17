//
// This file builds out the challenge web pages. A simple static site
// generator. It uses `partials` and `layouts`.
//

const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')
const locale = require('./locale.js')

const layout = fs.readFileSync(path.normalize(path.join(__dirname, '../resources/layouts/challenge.hbs'))).toString()
let files = []

// Take in a language type if any
const langs = locale.getAvaiableLocales()
let input = ''
let output = ''

// If built not exist, create one
try {
  fs.accessSync(path.join(locale.getLocaleBuiltPath(langs[0]), '..'))
} catch (e) {
  fs.mkdirSync(path.join(locale.getLocaleBuiltPath(langs[0]), '..'))
}

for (const lang in langs) {
  // If locale folder not exist, create one.
  fs.mkdirSync(locale.getLocaleBuiltPath(langs[lang]), { recursive: true })
  input = path.join(locale.getLocaleResourcesPath(langs[lang]), 'challenges')
  output = path.join(locale.getLocaleBuiltPath(langs[lang]), 'challenges')
  fs.mkdirSync(output, { recursive: true })
  files = fs.readdirSync(input).filter(function (file) { return file.endsWith('.html') }).sort()
  buildChallenges(files, langs[lang])
}

function buildChallenges (files, lang) {
  files.forEach(function (file) {
    // shouldn't have to do this if my
    // mapping were correct
    if (!file || !lang) return

    // if language, run the noun and verb
    // translations

    const content = {
      header: buildHeader(file, lang),
      sidebar: buildSidebar(file, lang),
      footer: buildFooter(file, lang),
      body: buildBody(file, lang),
      lang,
      challengetitle: makeTitleName(file, lang)
    }

    content.shortname = makeShortname(file).replace('.', '')
    const template = Handlebars.compile(layout)
    const final = template(content)
    fs.writeFileSync(path.join(output, content.shortname + '.html'), final)
  })
  // hard coded right now because, reasons
  console.log('Built ' + lang + ' challenges!')
}

function makeShortname (filename) {
  // BEFORE guide/challenge-content/10_merge_tada.html
  // AFTER  merge_tada
  return filename.split('/').pop().split('_')
    .slice(1).join('_').replace('html', '')
}

function makeTitleName (filename, lang) {
  const short = makeShortname(filename).split('_').join(' ').replace('.', '')
  return grammarize(short, lang)
}

function makeTitle (title, lang) {
  const short = title.split('_').join(' ').replace('.', '')
  const grammarized = grammarize(short, lang)

  return grammarized
}

function getSectionTitle (section, lang) {
  const sectionTranslations = {
    basics: {
      'en-US': 'Basics',
      'de-DE': 'Grundlagen'
    },
    advanced: {
      'en-US': 'Advanced',
      'de-DE': 'Fortgeschritten'
    }
  }

  return (sectionTranslations[section] && sectionTranslations[section][lang]) || sectionTranslations[section]['en-US']
}

function buildHeader (filename, lang) {
  const num = filename.split('/').pop().split('_')[0]
  const data = getPrevious(num, lang)
  const title = makeTitleName(filename, lang)
  const source = fs.readFileSync(getPartial('chal-header', lang)).toString().trim()
  const template = Handlebars.compile(source)
  const content = {
    challengetitle: title,
    challengenumber: num,
    localemenu: new Handlebars.SafeString(locale.getLocaleMenu(lang)),
    lang,
    preurl: data.preurl,
    nexturl: data.nexturl
  }
  return template(content)
}

function buildSidebar (filename, lang) {
  const currentTitle = makeTitleName(filename)
  const allChallenges = Object.keys(require('../empty-data.json')).map(function (title) {
    const currentChallenge = currentTitle === makeTitle(title, lang)
    return [title, makeTitle(title, lang), currentChallenge]
  })

  // Split challenges into basics and advanced
  const basicsChallenges = ['get_git', 'repository', 'commit_to_it', 'githubbin', 'remote_control', 'forks_and_clones']
  const advancedChallenges = ['branches_arent_just_for_birds', 'its_a_small_world', 'pull_never_out_of_date', 'requesting_you_pull_please', 'merge_tada']

  // Determine which section the current challenge belongs to
  const currentChallengeKey = filename.split('/').pop().split('_').slice(1).join('_').replace('.html', '')
  const isBasicsChallenge = basicsChallenges.includes(currentChallengeKey)
  const isAdvancedChallenge = advancedChallenges.includes(currentChallengeKey)

  // Filter challenges based on current section
  const challenges = allChallenges.filter(function (challenge) {
    const challengeKey = challenge[0]
    if (isBasicsChallenge) {
      return basicsChallenges.includes(challengeKey)
    } else if (isAdvancedChallenge) {
      return advancedChallenges.includes(challengeKey)
    }
    return true // fallback to show all
  })

  // Determine section title with translations
  let sectionTitle = 'Challenges' // default
  if (isBasicsChallenge) {
    sectionTitle = getSectionTitle('basics', lang)
  } else if (isAdvancedChallenge) {
    sectionTitle = getSectionTitle('advanced', lang)
  }

  const num = filename.split('/').pop().split('_')[0]
  const data = getPrevious(num, lang)
  const source = fs.readFileSync(getPartial('chal-sidebar', lang)).toString().trim()
  const template = Handlebars.compile(source)
  const content = {
    challenges,
    challengetitle: currentTitle,
    challengenumber: num,
    lang,
    sectiontitle: sectionTitle,
    preurl: data.preurl,
    nexturl: data.nexturl
  }
  return template(content)
}

function grammarize (name, lang) {
  if (lang === 'de-DE') {
    const germanTitles = {
      get_git: 'Git installieren',
      repository: 'Repository anlegen',
      commit_to_it: 'Änderungen committen',
      githubbin: 'GitHub-Profil einrichten',
      remote_control: 'Remote verbinden',
      forks_and_clones: 'Forks und Klone',
      branches_arent_just_for_birds: 'Branches sind nicht nur was für Vögel',
      its_a_small_world: 'Eine kleine Welt',
      pull_never_out_of_date: 'Bring deinen Branch auf den neuesten Stand',
      requesting_you_pull_please: 'Ein Pull Request, bitte',
      merge_tada: 'Merge, tada!'
    }
    const key = name.toLowerCase().replace(/ /g, '_').replace(/'/g, '')
    if (germanTitles[key]) return germanTitles[key]
  }
  let correct = name
  const wrongWords = ['arent', 'githubbin', 'its']
  const rightWords = ["aren't", 'GitHubbin', "it's"]

  wrongWords.forEach(function (word, i) {
    if (name.match(word)) {
      correct = name.replace(word, rightWords[i])
    }
  })
  return correct
}

function buildFooter (file, lang) {
  const num = file.split('/').pop().split('_')[0]
  const data = getPrevious(num, lang)
  const source = fs.readFileSync(getPartial('chal-footer', lang)).toString().trim()
  data.lang = lang
  const template = Handlebars.compile(source)
  return template(data)
}

function buildBody (file, lang) {
  const source = fs.readFileSync(path.join(input, file)).toString()
  const template = Handlebars.compile(source)

  const content = {
    verify_button: fs.readFileSync(getPartial('verify-button', lang)).toString().trim(),
    verify_directory_button: fs.readFileSync(getPartial('verify-directory-button', lang)).toString().trim()
  }

  return template(content)
}

function getPrevious (num, lang) {
  const pre = parseInt(num, 10) - 1
  const next = parseInt(num, 10) + 1
  let preurl = ''
  let prename = ''
  let nexturl = ''
  let nextname = ''
  files.forEach(function (file) {
    const regexPre = '(^|[^0-9])' + pre + '([^0-9]|$)'
    const regexNext = '(^|[^0-9])' + next + '([^0-9]|$)'
    if (pre === 0) {
      prename = 'All Challenges'
      preurl = path.join('../', 'pages', 'index.html')
    } else if (file.match(regexPre)) {
      prename = makeTitleName(file, lang)
      preurl = file.replace(pre + '_', '')
    }
    if (next === 12) {
      nextname = lang === 'de-DE' ? 'Im eigenen Repository weiterüben' : 'Continue in your own repository'
      nexturl = '../pages/own-repository.html'
    } else if (file.match(regexNext)) {
      nextname = makeTitleName(file, lang)
      nexturl = file.replace(next + '_', '')
    }
  })
  return {
    prename,
    preurl,
    nextname,
    nexturl
  }
}

function getPartial (filename, lang) {
  try {
    const pos = path.join(locale.getLocaleResourcesPath(lang), 'partials/' + filename + '.html')
    fs.statSync(pos)
    return pos
  } catch (e) {
    return path.join(locale.getLocaleResourcesPath(locale.getFallbackLocale()), 'partials/' + filename + '.html')
  }
}
