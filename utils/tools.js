
import fs from 'fs'
import yaml from 'yaml'
import chokidar from 'chokidar'

import { basename, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const pluginName = yaml.parse(fs.readFileSync(`./plugins/${basename(dirname(__dirname))}/default/index.config.yaml`, 'utf8')).pluginName

const defaultDir = `./plugins/${pluginName}/default`
const userConfigDir = `./plugins/${pluginName}/config`

// const __dirname = dirname(fileURLToPath(import.meta.url))
// const pluginName = 'diy'

// const defaultDir = `../default`
// const userConfigDir = `../config`

// let logger = console

class tools {
    constructor() {
        /** 默认设置 */
        this.defaultPath = './default'
        this.defaultConfig = {}
    }

    /**
     * 监听配置文件的修改
     * @param {*} filePath 
     * @param {*} app 
     * @param {*} name 
     * @param {*} type 
     * @returns 
     */
    watch(filePath, app, name, type = 'defaultConfig') {
        let flag = `${app}.${name}`
        if (this.watcher[type][flag]) return

        let watcher = chokidar.watch(filePath)
        watcher.on('change', path => {
            delete this[type][flag]
            logger.mark(`[修改配置文件][${type}][${app}][${name}]`)
            if (this[`change_${app}${name}`]) {
                this[`change_${app}${name}`]()
            }
        })
        this.watcher[type][flag] = watcher
    }

    /**
     * 用于初始化功能的配置文件
     * @param app 
     * @param name 
     */
    copyDefaultConfig(app, name) {
        if (!fs.existsSync(`./plugins/${this.pluginName}/config`)) {
            fs.mkdirSync(`./plugins/${this.pluginName}/config`)
        }
        let userConfig = `./plugins/${this.pluginName}/config/${app}.${name}.yaml`
        if (!fs.existsSync(userConfig)) {
            fs.copyFileSync(`./plugins/${this.pluginName}/default/${app}/${name}.yaml`, userConfig)
        }
    }

    /**
     * 用于获取文件的路径
     * @param  app 功能名称
     * @param  name 功能所需文件名
     * @param  type 默认配置: defaultConfig, 用户自定义配置: config
     * @returns 
     */
    getFilePath(app, name, type) {
        if (type == 'defaultConfig')
            return `${this.defaultPath}/${app}/${name}.yaml`
        else
            return `${this.configPath}/${app}.${name}.yaml`
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
     * 读取 yaml 配置文件
     * @param {*} app app 功能
     * @param {*} name app 配置文件名
     * @param {*} type 读取类型, -config, -default
     * @returns 
     */
    readYaml(app, name, type = 'config') {
        if (!(type == 'config' || type == 'default')) {
            return logger.error('读取配置文件出错')
        }
        let filePath = `./plugins/${pluginName}/${type}/${app}.${name}.yaml`
        if (this.isFileValid(filePath)) {
            return yaml.parse(fs.readFileSync(filePath, 'utf8'))
        } else {
            return logger.error(`找不到 ${filePath} 文件`)
        }
    }

    /**
     * 用于判断功能是否开启
     * @param {*} app app 名称
     * @param {*} name function 名称
     * @returns 
     */
    isFuncEnable(app, name) {
        if (!this.isFileValid(`${userConfigDir}/index.config.yaml`)) {
            return logger.info(`配置文件 ${userConfigDir}/index.config.yaml 不存在`)
        }
        let configs = this.readYaml('index', 'config', 'config')
        for (let _app in configs.apps) {
            for (let func of configs.apps[_app]) {
                for (let _func in func) {
                    if ((_app == app && _func == name))
                        return func[_func]
                }
            }
        }
        return logger.error(`功能 [${app}][${name}] 不存在`)
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
     * @param {*} name 
     */
    copyConfigFile(app, name) {
        if (!this.isDirValid(defaultDir)) {
            return logger.info(`默认文件夹 ${defaultDir} 不存在`)
        }
        if (!this.isDirValid(userConfigDir)) {
            return logger.info(`目标文件夹 ${userConfigDir} 不存在`)
        }
        let fromFile = `${defaultDir}/${app}.${name}.yaml`
        let toFile = `${userConfigDir}/${app}.${name}.yaml`
        this.copyFile(fromFile, toFile, (err) => {
            return logger.err(err)
        })
    }

}

export default new tools()