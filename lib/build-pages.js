//
// This file builds out the general web pages (like the about page). A simple
// static site generator. It uses `partials` and `layouts`.
//

const fs = require('fs')
const path = require('path')
const locale = require('./locale.js')
const Handlebars = require('handlebars')

const langs = locale.getAvaiableLocales()

const layout = fs.readFileSync(path.normalize(path.join(__dirname, '..', 'resources', 'layouts', 'page.hbs'))).toString()
let input = ''
let output = ''

for (const lang in langs) {
  input = path.join(locale.getLocaleResourcesPath(langs[lang]), 'pages')
  output = path.join(locale.getLocaleBuiltPath(langs[lang]), 'pages')

  // If folder not exist, create it
  fs.mkdirSync(output, { recursive: true })
  const pageFiles = fs.readdirSync(input)
  buildPages(pageFiles, langs[lang])
}

function buildPages (files, lang) {
  files.forEach(function construct (file) {
    if (!file.match('html')) return
    let final = ''
    if (file === 'index.html' || file === 'own-repository.html') {
      final = buildStandalonePage(file, lang)
    } else {
      const content = {
        header: buildHeader(file, lang),
        footer: buildFooter(file, lang),
        body: fs.readFileSync(path.join(input, file)).toString(),
        lang
      }
      const template = Handlebars.compile(layout)
      final = template(content)
    }
    fs.writeFileSync(path.join(output, file), final)
  })
  console.log('Built ' + lang + ' pages!')
}

function buildFooter (filename, lang) {
  const source = fs.readFileSync(getPartial('footer', lang)).toString()
  const template = Handlebars.compile(source)
  return template()
}

function buildHeader (filename, lang) {
  const source = fs.readFileSync(getPartial('header', lang)).toString()
  const template = Handlebars.compile(source)
  const contents = {
    pageTitle: filename.replace(/.html/, ''),
    localemenu: new Handlebars.SafeString(locale.getLocaleMenu(lang)),
    lang
  }
  return template(contents)
}

function buildStandalonePage (file, lang) {
  const source = fs.readFileSync(path.join(input, file)).toString()
  const template = Handlebars.compile(source)
  const content = {
    localemenu: new Handlebars.SafeString(locale.getLocaleMenu(lang))
  }
  return template(content)
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
