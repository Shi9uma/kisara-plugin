import fs from 'fs'
import tools from './utils/tools.js'

const pluginName = 'diy'
const userConfigDir = ''
if (!tools.isDirValid(`./plugins/${pluginName}/config`)) {
  tools.makeDir()
  tools.copyConfigFile('main', 'config')
}



const files = fs.readdirSync(`./plugins/${pluginName}/apps`).filter(file => file.endsWith('.js'))

let jsList = []
files.forEach((file) => {
  jsList.push(import(`./apps/${file}`))
})
jsList = await Promise.allSettled(jsList)

let appList = {}
for (let i in files) {
  let name = files[i].replace('.js', '')

  if (jsList[i].status != 'fulfilled') {
    logger.error(`载入插件错误：${logger.red(name)}`)
    logger.error(jsList[i].reason)
    continue
  }

  for (let j in ret[i].value) {
    appList[j] = ret[i].value[j]
  }
}
export { appList }
