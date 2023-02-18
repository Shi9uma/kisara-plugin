import fs from 'fs'
import yaml from 'yaml'

import { basename, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
let pluginName = basename(__dirname)
pluginName = yaml.parse(fs.readFileSync(`./plugins/${basename(__dirname)}/default/index.config.yaml`, 'utf8')).pluginName

logger.info(pluginName)
let files = fs.readdirSync(`./plugins/${pluginName}/apps`).filter(file => file.endsWith('.js'))

let ret = []
files.forEach((file) => {
  ret.push(import(`./apps/${file}`))
})
ret = await Promise.allSettled(ret)

let apps = {}
for (let i in files) {
  let name = files[i].replace('.js', '')

  if (ret[i].status != 'fulfilled') {
    logger.error(`载入插件错误：${logger.red(name)}`)
    logger.error(ret[i].reason)
    continue
  }

  for (let j in ret[i].value) {
    apps[j] = ret[i].value[j]
  }
}
export { apps }
