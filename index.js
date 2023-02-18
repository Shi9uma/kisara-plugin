import fs from 'fs'
import yaml from 'yaml'
import tools from './utils/tools.js'

import { basename, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const pluginName = yaml.parse(fs.readFileSync(`./plugins/${basename(__dirname)}/default/index.config.yaml`, 'utf8')).pluginName

let defaultDir = `./plugins/${pluginName}/default`
let userConfigDir = `./plugins/${pluginName}/config`
if (!tools.isDirValid(defaultDir)) {
	logger.info(`默认配置文件夹 ${defaultDir} 不存在, 为保证插件正常运行, 请通过 github 获取默认配置文件。`)
}
if (!tools.isDirValid(userConfigDir)) {
	tools.makeDir(userConfigDir)
	let defaultConfigFileList = tools.getDefaultConfigFileList()
	for (let fileName of defaultConfigFileList) {
		tools.copyConfigFile(fileName[0], fileName[1])
	}
}

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
