
import fs from 'fs'
import yaml from 'js-yaml'
import https from 'https'
import moment from 'moment'

import { basename, dirname } from "node:path"
import { fileURLToPath } from "node:url"

class tools {
    constructor() {
        this.__dirname = dirname(fileURLToPath(import.meta.url))
        this.pluginName = basename(dirname(this.__dirname))

        this.defaultDir = `./plugins/${this.pluginName}/default`
        this.userConfigDir = `./plugins/${this.pluginName}/config`

        this.prefix = `[-] ${this.pluginName}.utils.tools`
    }

    /**
     * 初始化本插件
     * @returns 
     */
    init() {
        // 检查相关配置文件夹
        let defaultDir = this.defaultDir,
            userConfigDir = this.userConfigDir

        if (!this.isDirValid(defaultDir)) {
            logger.warn(`${this.prefix} 文件夹 ${defaultDir} 不存在, 请从本仓库获取完整的文件夹`)
            return false
        }

        if (!this.isDirValid(userConfigDir)) {
            logger.warn(`${this.prefix} 文件夹 ${userConfigDir} 不存在, 正在从默认文件夹中获取配置`)
            this.makeDir(userConfigDir)
        }

        let defaultConfigFileList = this.getDefaultConfigFileList()
        for (let fileName of defaultConfigFileList) {
            if (!this.isFileValid(`${userConfigDir}/${fileName[0]}.${fileName[1]}.yaml`))
                this.copyConfigFile(fileName[0], fileName[1])
            else continue
        }
    }

    /**
     * 异步实现秒暂停, 需要 await
     * @param {*} time 秒
     * @returns 
     */
    wait(time) {
        return new Promise(resolve => setTimeout(() => resolve(), time * 1000))
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
        fs.mkdir(dirPath, (err) => { if (err) logger.warn(this.prefix, err) })
    }

    /**
     * 复制文件, 对象为文件
     * @param {*} from 路径, 到文件
     * @param {*} to 路径, 到文件
     */
    copyFile(from, to) {
        fs.copyFile(from, to, (err) => { if (err) logger.warn(this.prefix, err) })
    }

    /**
     * 删除指定文件
     * @param {*} filePath 要删除文件的路径
     */
    deleteFile(filePath) {
        fs.unlink(filePath, (err) => { if (err) logger.warn(this.prefix, err) })
    }

    /**
     * 读取 yaml 配置文件
     * @param {*} app app 功能
     * @param {*} func app 配置文件名
     * @param {string} type 读取类型, -config(默认), -default
     * @param {string} encoding 读取格式, 默认 utf8
     * @returns 
     */
    readYamlFile(app, func, type = 'config', encoding = 'utf8') {
        if (!(type == 'config' || type == 'default')) {
            return logger.error('读取配置文件出错')
        }
        let filePath = `./plugins/${this.pluginName}/${type}/${app}.${func}.yaml`
        if (this.isFileValid(filePath)) {
            return yaml.load(fs.readFileSync(filePath, 'utf8'))
        } else {
            return logger.warn(`${this.prefix} 找不到 ${filePath} 文件`)
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
     * 返回 json 文件数据
     * @param {*} filePath 
     * @returns 
     */
    readJsonFile(filePath) {
        return JSON.parse(this.readFile(filePath))
    }

    /**
     * 写入 json 文件
     * @param {string} filePath json 文件路径
     * @param {*} data 要写入的 json 数据
     * @param {number} tab json 文件默认缩进
     */
    writeJsonFile(filePath, data, tab = 4) {
        if (!this.isFileValid(filePath)) {
            logger.warn(this.prefix, `文件路径：${filePath} 非法`)
            return
        }
        fs.writeFile(filePath, JSON.stringify(data, null, tab), (err) => {
            if (err) logger.warn(err)
        })
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
        let configs = this.readYamlFile('index', 'config', 'config')
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
        let configs = this.readYamlFile('index', 'config', 'default')
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
            if (err) logger.warn(this.prefix, err)
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
                    if (err) logger.warn(`${this.prefix} 图片 ${imgUrl} 获取失败`)
                    else logger.info(`${this.prefix} 图片 ${imgUrl} 成功保存到 ${saveImgPath}`)
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
    makeForwardMsg(title, forwardMsgArr, end, e, Bot) {
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

        forwardMsg.push({
            ...userInfo,
            message: end
        })

        forwardMsg = e.isGroup ? e.group.makeForwardMsg(forwardMsg) : e.friend.makeForwardMsg(forwardMsg)

        return forwardMsg
    }

    /**
     * 获取 redis 中 key 的值, 需要 await
     * @param {*} key 
     * @returns promise 对象
     */
    getRedis(key) {
        return redis.get(key)
    }

    /**
     * 查看 key 还有多久失效, 需要 await
     * @param {*} key
     * > 查看 tools.genRedisKey 生成的 key 在 redis 中剩余的时间, 单位是 s, 
     * > 
     * > 使用示例
     * > 
     * > await tools.ttlRedis(tools.checkRedis(..., {getKey: true})[1])
     * > 
     * > 这里的 tools.checkRedis() 在指定了 getKey 后, 返回 [bool, key]
     * @returns 
     */
    ttlRedis(key) {
        return redis.ttl(key)
    }

    /**
     * 判断 key 是否已设置, 需要 await
     * @param {*} key 
     * @returns promise 对象
     */
    isRedisSet(key) {
        return redis.get(key)
    }

    /**
     * 为 key: value 设置 redis 内容
     * @param {*} key 键
     * @param {*} seconds 该键值对生存时间, 单位为秒
     * @param {*} value 值
     */
    setRedis(key, seconds, value) {
        redis.setEx(key, seconds, value)
    }

    /**
     * 删除 redis 中的某个键值对, 需要 await
     * @param {*} key 键
     * @returns bool, 删除是否成功
     */
    async delRedisKey(key) {
        return (await redis.del(key)) ? true : false
    }

    /**
     * 生成统一格式的 key
     * @param {*} e 传入 this.e
     * @param {*} type 生成 redis key 的类型
     * 
     * 私人: [p, private, isPrivate],
     * 
     * 群: [g, group, isGroup],
     * 
     * 全局: [global, isGlobal]
     * @returns 返回生成的 key
     */
    genRedisKey(e, type) {
        let isPrivate = ['p', 'private', 'isPrivate'].includes(type) ? true : false,
            isGroup = ['g', 'group', 'isGroup'].includes(type) ? true : false,
            isGlobal = ['global', 'isGlobal'].includes(type) ? true : false,
            key = e.logFnc

        if (isGroup) {
            key += `.isGroup.${e.group_id}`
        } else if (isPrivate) {
            key += `.isPrivate.${e.user_id}`
        } else if (isGlobal) {
            key += `.isGlobal.${e.user_id}`
        }
        return key += `.${e.user_id}`
    }

    /**
     * 计算现在到目标时间剩余的秒数
     * @param {*} endTime 目标时间, 缺省是 '23:59:59'
     * @returns 剩余时间, 单位是秒
     */
    calLeftTime(endTime = '23:59:59') {
        return moment(endTime, 'HH:mm:ss').diff(moment(), 'seconds')
    }

    /**
     * redis 中是否有过值, 有返回 true, 没有则返回 false
     * @param {*} e 传入 this.e
     * @param {*} type
     * > 生成 redis key 的类型
     * > 
     * > 私人: [p, private, isPrivate],
     * > 
     * > 群: [g, group, isGroup],
     * > 
     * > 全局: [global, isGlobal]
     * @param {*} cd 键值对存活时间, cd * timeFormat
     * @param {*} value 要设置的键值, 默认传入缺省是今日日期
     * @param {*} timeFormat
     * > 时间单位, 默认是 hour
     * > 
     * > 小时: [h, hour],
     * > 
     * > 分钟: [m, min, minute],
     * > 
     * > 秒: else
     * @param {boolean} isMaster 是否开启主人不受限制
     * @param {boolean} getKey 是否获取生成的 key
     * @returns 返回值为 bool 或 [key, bool](if getKey == true)
     */
    async checkRedis(e, type, cd, {value = moment().format('yyyy-MM-DD'), timeFormat = 'hour', isMaster = true, getKey = false}) {

        let key = this.genRedisKey(e, type)

        if (e.isMaster && isMaster) return getKey == true ? [false, key] : false
        if(await this.isRedisSet(key)) return getKey == true ? [true, key] : true

        if (['h', 'hour'].includes(timeFormat)) {
            timeFormat = 60 * 60
        } else if (['m', 'min', 'minute'].includes(timeFormat)) {
            timeFormat = 60
        } else {
            timeFormat = 1
        }

        this.setRedis(key, timeFormat * cd, value)
        return getKey == true ? [false, key] : false
    }
}

export default new tools()