import fs from 'fs'
import tools from './utils/tools.js'

const pluginName = tools.getPluginName()
const appList = fs.readdirSync(`./plugins/${pluginName}/apps`).filter(file => file.endsWith('.js'))

logger.info('----------- ^_^ -----------')
logger.info(`正在加载 ${pluginName} 插件`)

// 初始化检查
tools.init()

// 正式加载插件
let loadedAppList = []
appList.forEach((file) => {
	loadedAppList.push(import(`./apps/${file}`))
})
loadedAppList = await Promise.allSettled(loadedAppList)

let apps = {}
for (let i in appList) {
	let app = appList[i].replace('.js', '')
	if (loadedAppList[i].status != 'fulfilled') {
		logger.warn(`载入插件错误：${logger.warn(app)}`)
		logger.warn(loadedAppList[i].reason)
		continue
	}

	for (let func in loadedAppList[i].value) {
		if (tools.isFuncEnable(app, func))
			apps[func] = loadedAppList[i].value[func]
		else continue
	}
}

// 这里必须得是 apps
export { apps }

logger.info(`插件 ${pluginName} 加载完成, enjoy~`)
logger.info('----------- ^_^ -----------')
