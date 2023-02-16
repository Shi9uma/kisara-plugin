import fs from 'node:fs'

const files = fs.readdirSync('./plugins/diy/apps').filter(file => file.endsWith('.js'))

let ret = []

files.forEach((file) => {
  ret.push(import(`./apps/${file}`))
})
logger.info(ret)

ret = await Promise.allSettled(ret)
logger.info(ret)

let apps = {}
for (let i in files) {
  let name = files[i].replace('.js', '')

  if (ret[i].status != 'fulfilled') {
    logger.error(`载入插件错误：${logger.red(name)}`)
    logger.error(ret[i].reason)
    continue
  }
  // apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
  apps[name] = ret[i].value[Object.keys(ret[i].value)]
}
logger.info(apps)
export { apps }
