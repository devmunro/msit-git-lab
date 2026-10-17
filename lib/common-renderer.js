(function () {
  'use strict'
  const api = window.msitGitLab
  const select = document.getElementById('lang-select')
  const match = window.location.pathname.match(/built\/([a-z]{2}-[A-Z]{2})/)
  const language = match && match[1] === 'de-DE' ? 'de-DE' : 'en-US'

  if (select) {
    select.value = language
    select.addEventListener('change', function () {
      window.location.href = window.location.href.replace(/built\/[a-z]{2}-[A-Z]{2}/, 'built/' + select.value)
    })
  }

  document.addEventListener('click', function (event) {
    const anchor = event.target.closest && event.target.closest('a[href]')
    if (!anchor) return
    let target
    try { target = new URL(anchor.href) } catch (error) { return }
    if (target.protocol !== 'https:' || target.origin === window.location.origin) return
    if (!api || typeof api.openExternal !== 'function') return
    event.preventDefault()
    api.openExternal(target.href)
  })
})()
