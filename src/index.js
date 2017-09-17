const index = require('../config.json')[0] //for now take the first one
const mime = require('mime')
const prettyBytes = require('pretty-bytes')
const choo = require('choo')
const html = require('choo/html')
const log = require('choo-log')
const css = require('sheetify')
const formatDistance = require('date-fns/formatDistance')
const Release = require('scene-release-parser')

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
  state.links = list.links.reverse()
  state.total = state.links.length

  for (let i = 0; i < state.total; i++) {
    state.links[i] = {loaded: false, link: state.links[i]}
  }

}

async function buildList(state, emitter) {
  let end = state.parse.end
  if (state.total < end) {
    end = state.total
  }

  for (let i = state.parse.start; i < end; i++) {
    const item = state.links[i]
    const liArchive = new DatArchive(item.link)
    const files = await liArchive.readdir('/')
    const info = await liArchive.getInfo()

    //enc, source, langue, group
    Object.assign(state.links[i], info, {
      files: files.filter((file) => file !== 'dat.json').map((e) => {
        return {
          name: e,
          uri: encodeURIComponent(e),
          type: mime.lookup(e)
        }
      }),
      expanded: false,
      loaded: true,
      release: new Release(info.title || '', false)
    })

    state.parsed++
  }
}

async function parseInterval(state, emitter) {
  if (state.parsed >= state.total) {
    return
  }

  state.parse.start += state.batch
  state.parse.end += state.batch

  await buildList(state, emitter)
  setTimeout(() => parseInterval(state, emitter), state.interval)
}

function linksStore (state, emitter) {
  if (!state.links) {
    state.links = []
  }

  state.batch = 100

  // visual
  state.start = 0
  state.end = state.batch

  state.parsed = 0
  state.interval = 100

  state.parse = {start: 0, end: state.batch}

  emitter.on('DOMContentLoaded', async function onDOMContentLoaded () {
    await loadList(state, emitter)
    await buildList(state, emitter)
    emitter.emit('render')

    setTimeout(() => parseInterval(state, emitter), state.interval)
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
        ${link.release.source}
        ${link.release.encoding}
        ${link.release.lang}
        ${link.release.group}
      </div>
      <div class="col-half">
        <a href="#" onclick="${expand}">${link.title}</a>
      </div>
      <div class="col-tenth">
        ${prettyBytes(link.size || 0)} in ${link.files.length} files (${link.peers} peers)
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
                html`<a href="/audio/${link.url}/${file.uri}">audio icon</a>`
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
    ${state.links.filter((e, i) => {
      return i >= state.start && i < state.end
    }).map((link) => {
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

function audioView(state, emit) {
  return html`
  <div id="app">
    <audio src="${state.params.wildcard}" controls></audio>
    Audio not starting? <a href="${state.params.wildcard}">Download it!</a>
  </div>`
}
