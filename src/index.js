const index = require('../config.json')[0] //for now take the first one
const mime = require('mime')
const prettyBytes = require('pretty-bytes')
const choo = require('choo')
const html = require('choo/html')
const log = require('choo-log')
const css = require('sheetify')
const formatDistance = require('date-fns/formatDistance')

css('./style.css')

const app = choo()
app.use(log())
app.use(linksStore)
app.route('/', listView)
app.route('/video/*', videoView)
app.route('/audio/*', audioView)
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

    state.links[i] = Object.assign(info, {files: files.filter((file) => file !== 'dat.json').map((e) => {
      return {
        name: e,
        uri: encodeURIComponent(e),
        type: mime.lookup(e)
      }
    }), expanded: false})
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
  return html`
  <div class="element">
    <div class="row">
      <div class="col-tenth">
        ${formatDistance(link.mtime ? new Date(link.mtime) : new Date(), new Date())}
      </div>
      <div class="col-tenth">
        Tag
      </div>
      <div class="col-half">
        <a href="#" onclick="${expand}">${link.title}</a>
      </div>
      <div class="col-tenth">
        ${prettyBytes(link.size)} in ${link.files.length} files
      </div>
      <div class="col-fifth">
        <a href="${link.url}" target="_blank">directory icon</a>
      </div>
    </div>
    ${!link.expanded ? '' : html`
    <div class="row">
      <div class="col">
      ${link.files.map((file) => {
        return html`
          <div class="row">
            <div class="col-half">
              <a href="${link.url}/${file.name}">${file.name}</a>
            </div>
            <div class="col-fifth">
              ${file.type.startsWith('video') ?
                html`<a href="/video/${link.url}/${file.uri}">video icon</a>`
                :
                file.type.startsWith('audio') ?
                html`<a href="/audio/${link.url}/${file.uri}">video icon</a>`
                :
                html`<a href="${link.url}/${file.uri}">download icon</a>`
              }
            </div>
          </div>`
      })}
      </div>
    </div>
    `}
  </div>
  `

  function expand(e) {
    e.preventDefault()
    link.expanded = !link.expanded
    emit('render')
  }
}

function listView (state, emit) {
  return html`
  <div id="app">
    ${state.links.map((link) => {
      return elementView(link, emit)
    })}
  </div>`
}

function videoView(state, emit) {
  return html`
  <div id="app">
    <video src="${state.params.wildcard}" controls></video>
    Video not starting? <a href="${state.params.wildcard}">Download it!</a>
  </div>
  `
}

function audioView() {
  return html`
  <div id="app">
    <audio src="${state.params.wildcard}" controls></audio>
    Audio not starting? <a href="${state.params.wildcard}">Download it!</a>
  </div>`
}
