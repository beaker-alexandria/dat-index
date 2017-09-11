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
