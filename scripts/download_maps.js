const fetch = require('node-fetch')
const { createWriteStream } = require('fs')
const fs = require('fs').promises
const { promisify } = require('util')
const streamPipeline = promisify(require('stream').pipeline)

const starlistUrl = process.env.BRAWLAPI_URL || 'https://api.brawlify.com/';
const token = process.env.BRAWLAPI_TOKEN || '';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function getStarlistMaps() {
  return fetch(starlistUrl + '/maps', {
    headers: { 'Authorization': 'Bearer ' + token },
    compress: true,
  }).then(r => r.json())
}

function getStarlistModes() {
  return fetch(starlistUrl + '/gamemodes', {
    headers: { 'Authorization': 'Bearer ' + token },
    compress: true,
  }).then(r => r.json())
}

function getStarlistIcons() {
  return fetch(starlistUrl + '/icons', {
    headers: { 'Authorization': 'Bearer ' + token },
    compress: true,
  }).then(r => r.json())
}

async function main() {
  const icons = await getStarlistIcons()
  await fs.mkdir('./out/avatars', { recursive: true })
  for (const icon of [].concat(Object.values(icons.player), Object.values(icons.club))) {
    await streamPipeline((await fetch(icon.imageUrl)).body, createWriteStream('./out/avatars/' + icon.id + '.png'))
    await sleep(50)
  }

  const maps = (await getStarlistMaps()).list
  await fs.mkdir('./out/maps', { recursive: true })
  for (const map of maps) {
    await streamPipeline((await fetch(map.imageUrl)).body, createWriteStream('./out/maps/' + map.id + '.png'))
    await sleep(100)
  }

  const modes = (await getStarlistModes()).list
  for (const mode of modes) {
    const modeId = mode.name.toLowerCase().replace(/-| /g, '-')
    await fs.mkdir('./out/modes/' + modeId, { recursive: true })
    await streamPipeline((await fetch(mode.imageUrl)).body, createWriteStream('./out/modes/' + modeId + '/icon.png'))
    await sleep(100)
    await streamPipeline((await fetch(mode.imageUrl2)).body, createWriteStream('./out/modes/' + modeId + '/background.png'))
    await sleep(100)
  }
}

main().catch(console.error)
