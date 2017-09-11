const index = require('../config.json')[0] //for now take the first one
const prettyBytes = require('pretty-bytes')
const choo = require('choo')
const html = require('choo/html')
const log = require('choo-log')
const css = require('sheetify')

css('./style.css')

const app = choo()
app.use(log())
app.use(linksStore)
app.route('/', listView)
app.mount('#app')

async function loadList(state, emitter) {
  const archive = new DatArchive(index)
  list = await archive.readFile('/list.json')
  list = JSON.parse(list)
  state.links = list.links

  for (let i = 0; i < state.links.length; i++) {
    const liArchive = new DatArchive(state.links[i])
    const files = await liArchive.readdir('/')
    const info = await liArchive.getInfo()

    state.links[i] = Object.assign(info, {files: files, expanded: false})
  }

  emitter.emit('render')
}

function linksStore (state, emitter) {
  if (!state.links) {
    state.links = []
  }

  emitter.on('DOMContentLoaded', function onDOMContentLoaded () {
    loadList(state, emitter)
  })
}

function elementView (link, emit) {
  return html`<li onclick="${expand}">
    ${link.title} (${link.files.length} files ${prettyBytes(link.size)}) - ${new Date(link.mtime)} <a href="${link.url}" target="_blank">Open</a>
  </li>`

  function expand() {
    link.expanded = true
    emit('render')
  }
}

function expandedElementView (link, emit) {
  return html`<li onclick="${expand}">
    ${link.title} (${link.files.length} files ${prettyBytes(link.size)}) - ${new Date(link.mtime)}
    <ul>
      ${link.files.filter((file) => file !== 'dat.json').map((file) => {
        return html`<li><a href="${link.url}/${file}">${file}</a></li>`
      })}
    </ul>
  </li>`

  function expand() {
    link.expanded = false
    emit('render')
  }
}

function listView (state, emit) {
  return html`<div id="app"><ul>${state.links.map((link) => {
    return link.expanded ? expandedElementView(link, emit) : elementView(link, emit)
  })}</ul></div>`
}
