import fs from 'fs'
import yaml from 'yaml'
import tools from './utils/tools.js'

import { basename, dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const pluginName = yaml.parse(fs.readFileSync(`./plugins/${basename(__dirname)}/default/index.config.yaml`, 'utf8')).pluginName
let defaultDir = `./plugins/${pluginName}/default`
let userConfigDir = `./plugins/${pluginName}/config`

if (pluginName != basename(__dirname)) {
	logger.info(`插件文件夹名称与 ${defaultDir} 中的 pluginName 项不同, 请检查并重启 bot`)
	logger.info(`插件文件夹名称: ${__dirname}, pluginName: ${join(dirname(__dirname), pluginName)}`)
	fs.rename(__dirname, join(dirname(__dirname), pluginName), (err) => { logger.error(err) })
}
if (!tools.isDirValid(defaultDir)) {
	logger.info(`默认配置文件夹 ${defaultDir} 不存在, 为保证插件正常运行, 请通过 github 获取默认配置文件。`)
}
if (!tools.isDirValid(userConfigDir)) {
	logger.info(`用户配置文件夹 ${userConfigDir} 不存在, 将根据默认配置创建`)
	tools.makeDir(userConfigDir)
}
let defaultConfigFileList = tools.getDefaultConfigFileList()
for (let fileName of defaultConfigFileList) {
	if (!tools.isFileValid(`${userConfigDir}/${fileName[0]}.${fileName[1]}.yaml`))
		tools.copyConfigFile(fileName[0], fileName[1])
	else continue
}

const files = fs.readdirSync(`./plugins/${pluginName}/apps`).filter(file => file.endsWith('.js'))

let jsList = []
files.forEach((file) => {
	jsList.push(import(`./apps/${file}`))
})
jsList = await Promise.allSettled(jsList)

let apps = {}
for (let i in files) {
	let app = files[i].replace('.js', '')

	if (jsList[i].status != 'fulfilled') {
		logger.error(`载入插件错误：${logger.red(app)}`)
		logger.error(jsList[i].reason)
		continue
	}

	for (let func in jsList[i].value) {
		if (tools.isFuncEnable(app, func))
			apps[func] = jsList[i].value[func]
		else continue
	}
}

// 这里必须得是 apps
export { apps }
