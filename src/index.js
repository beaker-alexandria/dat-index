const Microbounce = require('microbounce')
const bounce = Microbounce()
const listInput = document.createElement('input');
listInput.setAttribute('type', 'text')

let links

async function main () {
  listInput.onkeydown = async function onKeyDown() {
    bounce(async function() {
      const container = document.getElementById('container')
      const archive = new DatArchive(listInput.value)
      let list = await archive.readFile('/list.json')

      try {
        list = JSON.parse(list)
        links = list.links
        await render()
      } catch(e) {}
    })
  }

  document.body.appendChild(listInput)
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
