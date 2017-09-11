(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports=[
  "dat://ca892c36635760d14ff660b8cd98e7bfdc859b2ce11db4688c3b2224d388c43f"
]

},{}],2:[function(require,module,exports){
const index = require('../config.json')[0] //for now take the first one
let links

async function main () {
    const container = document.getElementById('container')
    const archive = new DatArchive(index)
    let list = await archive.readFile('/list.json')

    try {
      list = JSON.parse(list)
      links = list.links
      await render()
    } catch(e) {}
}

async function render () {
  const fragment = document.createDocumentFragment()

  while (container.firstChild) {
    container.removeChild(container.firstChild)
  }

  for (let i = 0; i < links.length; i++) {
    const link = links[i]
    const li = document.createElement('li')
    const liArchive = new DatArchive(link)
    const files = await liArchive.readdir('/')

    li.innerHTML = `<a href="dat://${link}">${link} (${files.length} files)</a>`

    fragment.appendChild(li)
  }

  container.appendChild(fragment)
}

main()

},{"../config.json":1}]},{},[2]);
