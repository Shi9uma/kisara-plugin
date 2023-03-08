
import fs from 'fs'
import yaml from 'yaml'
import https from 'https'

import { basename, dirname } from "node:path"
import { fileURLToPath } from "node:url"

class tools {
    constructor() {
        this.__dirname = dirname(fileURLToPath(import.meta.url))
        this.pluginName = yaml.parse(fs.readFileSync(`./plugins/${basename(dirname(this.__dirname))}/default/index.config.yaml`, 'utf8')).pluginName

        this.defaultDir = `./plugins/${this.pluginName}/default`
        this.userConfigDir = `./plugins/${this.pluginName}/config`

        this.prefix = `[${this.pluginName}.utils.tools]`
    }

    /**
     * 返回本插件的名称
     */
    getPluginName() {
        return this.pluginName
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
            return `${this.defaultDir}/${app}.${func}.yaml`
        else
            return `${this.userConfigDir}/${app}.${func}.yaml`
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
        fs.mkdir(dirPath, (err) => { if (err) { return logger.info(this.prefix, err) } })
    }

    /**
     * 复制文件, 对象为文件
     * @param {*} from 路径, 到文件
     * @param {*} to 路径, 到文件
     */
    copyFile(from, to) {
        fs.copyFile(from, to, (err) => { return logger.info(this.prefix, err) })
    }

    /**
     * 删除指定文件
     * @param {*} filePath 要删除文件的路径
     */
    deleteFile(filePath) {
        fs.unlink(filePath, (err) => { return logger.info(this.prefix, err) })
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
        let filePath = `./plugins/${this.pluginName}/${type}/${app}.${func}.yaml`
        // let filePath = `../${type}/${app}.${func}.yaml`
        if (this.isFileValid(filePath)) {
            return yaml.parse(fs.readFileSync(filePath, 'utf8'))
        } else {
            return logger.error(`${this.prefix} 找不到 ${filePath} 文件`)
        }
    }

    /**
     * 读取文件内容
     * @param {*} filePath 
     * @returns 
     */
    readFile(filePath) {
        if (!this.isFileValid(filePath))
            return logger.warn(`${this.prefix} 目标文件 ${filePath} 不存在或不合法`)
        return fs.readFileSync(filePath, 'utf8')
    }

    /**
     * 用于判断功能是否开启
     * @param {*} app app 名称
     * @param {*} func function 名称
     * @returns 
     */
    isFuncEnable(app, func) {
        if (!this.isFileValid(`${this.userConfigDir}/index.config.yaml`)) {
            return logger.info(`配置文件 ${this.userConfigDir}/index.config.yaml 不存在`)
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
        return logger.error(`${this.prefix} 功能 [${app}][${func}] 不存在`)
    }

    /**
     * 获取配置文件列表
     */
    getDefaultConfigFileList() {
        if (!this.isFileValid(`${this.defaultDir}/index.config.yaml`)) {
            return logger.info(`${this.prefix} 配置文件 ${this.defaultDir}/index.config.yaml 不存在`)
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
        if (!this.isDirValid(this.defaultDir)) {
            return logger.info(`${this.prefix} 默认文件夹 ${this.defaultDir} 不存在`)
        }
        if (!this.isDirValid(this.userConfigDir)) {
            return logger.info(`${this.prefix} 目标文件夹 ${this.userConfigDir} 不存在`)
        }
        let fromFile = `${this.defaultDir}/${app}.${func}.yaml`
        let toFile = `${this.userConfigDir}/${app}.${func}.yaml`
        this.copyFile(fromFile, toFile, (err) => {
            return logger.err(this.prefix, err)
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
                        return logger.info(`${this.prefix} 图片 ${imgUrl} 获取失败`)
                    else
                        return logger.info(`${this.prefix} 图片 ${imgUrl} 成功保存到 ${saveImgPath}`)
                })
            })
        })
    }

    /**
     * 制作转发内容
     * @param {*} title 标题
     * @param {*} forwardMsgArr 转发内容集合
     * @param {*} end 结尾
     * @param {*} e 传入 this.e
     * @param {*} Bot 传入 global.Bot
     * @returns 
     */
    makeForwarMsg(title, forwardMsgArr, end, e, Bot) {
        let nickname = Bot.nickname

        if (e.isGroup) {
            let info = Bot.getGroupMemberInfo(e.group_id, Bot.uin)
            nickname = info.card ?? info.nickname
        }

        let userInfo = {
            user_id: Bot.uin,
            nickname
        }

        let forwardMsg = [{
            ...userInfo,
            message: title
        }]

        for (let msg of forwardMsgArr) {
            forwardMsg.push({
                ...userInfo,
                message: msg
            })
        }

        if (end) {
            forwardMsgArr.push({
                ...userInfo,
                message: end
            })
        }

        forwardMsg = e.isGroup ? e.group.makeForwarMsg(forwardMsg) : e.friend.makeForwardMsg(forwardMsg)

        return forwardMsg
    }
}

export default new tools()