import fs from 'fs'
import yaml from 'yaml'

import { basename, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pluginName = yaml.parse(fs.readFileSync(`./plugins/${basename(__dirname)}/default/index.config.yaml`, 'utf8')).pluginName
const files = fs.readdirSync(`./plugins/${pluginName}/apps`).filter(file => file.endsWith('.js'))

let jsList = []
files.forEach((file) => {
  jsList.push(import(`./apps/${file}`))
})
jsList = await Promise.allSettled(jsList)

let apps = {}
for (let i in files) {
  let name = files[i].replace('.js', '')

  if (jsList[i].status != 'fulfilled') {
    logger.error(`载入插件错误：${logger.red(name)}`)
    logger.error(jsList[i].reason)
    continue
  }

  for (let j in jsList[i].value) {
    apps[j] = jsList[i].value[j]
  }
}

export { apps }
