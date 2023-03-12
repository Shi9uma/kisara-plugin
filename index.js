import fs from 'fs'
import tools from './utils/tools.js'

// 进行初始化检查
tools.init()

/**
 * 加载插件
 */
const pluginName = tools.getPluginName()
const appList = fs.readdirSync(`./plugins/${pluginName}/apps`).filter(file => file.endsWith('.js'))

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
