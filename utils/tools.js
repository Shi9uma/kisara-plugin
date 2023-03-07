
import fs from 'fs'
import yaml from 'yaml'
import chokidar from 'chokidar'
import https from 'https'
import lodash from 'lodash'

import { basename, dirname } from "node:path"
import { fileURLToPath } from "node:url"

/** linux dev env */
const __dirname = dirname(fileURLToPath(import.meta.url))
const pluginName = yaml.parse(fs.readFileSync(`./plugins/${basename(dirname(__dirname))}/default/index.config.yaml`, 'utf8')).pluginName

const defaultDir = `./plugins/${pluginName}/default`
const userConfigDir = `./plugins/${pluginName}/config`

/** win dev env */
// const __dirname = dirname(fileURLToPath(import.meta.url))
// const pluginName = 'diy'

// const defaultDir = `../default`
// const userConfigDir = `../config`
// const logger = console

// let logger = console

class tools {
    constructor() {
        /** 默认设置 */
        this.defaultPath = './default'
        this.defaultConfig = {}
    }

    /**
     * 返回本插件的名称
     */
    getPluginName() {
        return basename(dirname(dirname(fileURLToPath(import.meta.url))))
    }

    /**
     * 用于获取文件的路径
     * @param  app 功能名称
     * @param  func 功能所需文件名
     * @param  type 默认配置: d for defaultConfig, 用户自定义配置: c for config
     * @returns 
     */
    getConfigFilePath(app, func, type = 'c') {
        if (type == 'd')
            return `${defaultDir}/${app}.${func}.yaml`
        else
            return `${userConfigDir}/${app}.${func}.yaml`
    }

    /**
     * 判断文件夹是否有效
     * @param {string} dirPath 文件夹路径
     */
    isDirValid(dirPath) {
        return fs.existsSync(dirPath)
    }

    /**
     * 判断文件是否有效
     * @param {*} fileName 文件路径
     */
    isFileValid(fileName) {
        return fs.existsSync(fileName)
    }

    /**
     * 创建文件夹
     * @param {*} dirPath 文件夹路径
     */
    makeDir(dirPath) {
        fs.mkdir(dirPath, (err) => { if (err) { return logger.info(err) } })
    }

    /**
     * 复制文件, 对象为文件
     * @param {*} from 路径, 到文件
     * @param {*} to 路径, 到文件
     */
    copyFile(from, to) {
        fs.copyFile(from, to, (err) => { return logger.info(err) })
    }

    /**
     * 删除指定文件
     * @param {*} filePath 要删除文件的路径
     */
    deleteFile(filePath) {
        fs.unlink(filePath, (err) => { return logger.info(err) })
    }

    /**
     * 读取 yaml 配置文件
     * @param {*} app app 功能
     * @param {*} func app 配置文件名
     * @param {*} type 读取类型, -config, -default
     * @returns 
     */
    readYaml(app, func, type = 'config') {
        if (!(type == 'config' || type == 'default')) {
            return logger.error('读取配置文件出错')
        }
        let filePath = `./plugins/${pluginName}/${type}/${app}.${func}.yaml`
        // let filePath = `../${type}/${app}.${func}.yaml`
        if (this.isFileValid(filePath)) {
            return yaml.parse(fs.readFileSync(filePath, 'utf8'))
        } else {
            return logger.error(`找不到 ${filePath} 文件`)
        }
    }

    /**
     * 用于判断功能是否开启
     * @param {*} app app 名称
     * @param {*} func function 名称
     * @returns 
     */
    isFuncEnable(app, func) {
        if (!this.isFileValid(`${userConfigDir}/index.config.yaml`)) {
            return logger.info(`配置文件 ${userConfigDir}/index.config.yaml 不存在`)
        }
        let configs = this.readYaml('index', 'config', 'config')
        for (let _app in configs.apps) {
            for (let _func of configs.apps[_app]) {
                for (let __func in _func) {
                    if ((_app == app && __func == func))
                        return _func[__func]
                }
            }
        }
        return logger.error(`功能 [${app}][${func}] 不存在`)
    }

    /**
     * 获取配置文件列表
     */
    getDefaultConfigFileList() {
        if (!this.isFileValid(`${defaultDir}/index.config.yaml`)) {
            return logger.info(`配置文件 ${defaultDir}/index.config.yaml 不存在`)
        }
        let configs = this.readYaml('index', 'config', 'default')
        let defaultConfigFileList = []
        for (let app in configs.configs) {
            for (let func of configs.configs[app]) {
                defaultConfigFileList.push([app, func])
            }
        }
        return defaultConfigFileList
    }

    /**
     * 只从 default 文件夹将所需的配置文件复制出来
     * @param {*} app 
     * @param {*} func 
     */
    copyConfigFile(app, func) {
        if (!this.isDirValid(defaultDir)) {
            return logger.info(`默认文件夹 ${defaultDir} 不存在`)
        }
        if (!this.isDirValid(userConfigDir)) {
            return logger.info(`目标文件夹 ${userConfigDir} 不存在`)
        }
        let fromFile = `${defaultDir}/${app}.${func}.yaml`
        let toFile = `${userConfigDir}/${app}.${func}.yaml`
        this.copyFile(fromFile, toFile, (err) => {
            return logger.err(err)
        })
    }

    /**
     * 通过 url 获取图像并保存
     * @param {*} imgUrl 图像 url
     * @param {*} imgName 要保存成的图像名字, 无后缀
     * @param {*} saveDirPath 图像保存文件夹路径
     * @param {*} imgType 图像保存的类型(后缀名)
     */
    saveUrlImg(imgUrl, imgName, saveDirPath, imgType = 'png') {
        https.get(imgUrl, (res) => {
            let imgData = ''
            res.setEncoding('binary')
            res.on('data', (chunk) => {
                imgData += chunk
            })
            let saveImgPath = `${saveDirPath}/${imgName}.${imgType}`
            res.on('end', () => {
                fs.writeFile(saveImgPath, imgData, 'binary', (err) => {
                    if (err)
                        return logger.info(`图片 ${imgUrl} 获取失败`)
                    else
                        return logger.info(`图片 ${imgUrl} 成功保存到 ${saveImgPath}`)
                })
            })
        })
    }

    /**
     * 实现插件热更新
     * @param {*} app   功能主题名 
     * @param {*} func  功能名
     */
    watch(app) {
        function watchDir(app) {
            if (this.watcher[app]) return

            let appDirPath = `./plugins/${pluginName}/apps`
            const watcher = chokidar.watch(appDirPath)
            if(watcher.on('all', lodash.debounce(update, 300)))
                logger.info('flag')
            
            // const watcher = chokidar.watch(appDirPath)
            // setTimeout(() => {
            //     watcher.on('add', async newApp => {
            //         let appList = path
            //     })
            // })
        }
        return watchDir(app)
    }
}

export default new tools()