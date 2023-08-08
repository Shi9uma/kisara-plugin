
import fs from 'fs'
import yaml from 'js-yaml'
import https from 'https'
import moment from 'moment'
import path from 'path'
import child_process from 'child_process'

import { URL } from 'url'
import { basename, dirname } from "node:path"
import { fileURLToPath } from "node:url"

class tools {
    constructor() {
        this.__dirname = dirname(fileURLToPath(import.meta.url))
        this.pluginName = basename(dirname(this.__dirname))

        this.defaultDir = `./plugins/${this.pluginName}/default`
        this.userConfigDir = `./plugins/${this.pluginName}/config`
        this.dataDir = `./plugins/${this.pluginName}/data`

        this.prefix = `[-] ${this.pluginName}.utils.tools =>`
    }

    /**
     * 初始化本插件
     * @returns 
     */
    init() {

        // 检查相关配置文件夹
        let defaultDir = this.defaultDir,
            userConfigDir = this.userConfigDir,
            defaultConfigFileList = this.getDefaultConfigFileList(),
            jsonFileDir = `${defaultDir}/json`,
            dataDir = this.dataDir


        if (!this.isDirValid(defaultDir)) {
            logger.warn(`${this.prefix} 文件夹 ${defaultDir} 不存在, 请从本仓库获取完整的文件夹`)
            return false
        }

        if (!this.isDirValid(userConfigDir)) {
            logger.warn(`${this.prefix} 文件夹 ${userConfigDir} 不存在, 正在从默认文件夹中获取配置`)
            this.makeDir(userConfigDir)
        }

        for (let fileName of defaultConfigFileList) {
            if (!this.isFileValid(`${userConfigDir}/${fileName[0]}.${fileName[1]}.yaml`)) {
                logger.warn(this.prefix, `copying ${defaultDir}/${fileName[0]}.${fileName[1]}.yaml => ${userConfigDir}/${fileName[0]}.${fileName[1]}.yaml`)
                this.copyConfigFile(fileName[0], fileName[1])
            }
            else continue
        }

        let jsonFileList = fs.readdirSync(jsonFileDir).filter(file => file.endsWith('.json'))
        jsonFileList.forEach((file) => {
            let jsonFilePath = `${dataDir}/${file}`
            if (!this.isFileValid(jsonFilePath))
                this.copyFile(`${jsonFileDir}/${file}`, jsonFilePath)
        })

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
     * @returns 文件是否存在
     */
    isFileValid(fileName) {
        return fs.existsSync(fileName)
    }

    /**
     * 获取文件相关信息, 例如大小, 创建时间等
     * @param {*} fileName 文件路径
     * @returns 字典
     */
    getFileStat(fileName) {
        return fs.statSync(fileName)
    }

    /**
     * 返回指定目录下文件数量
     * @param {string} dirPath 目标目录绝对路径
     * @param {string} fileType 筛选指定后缀的文件, 例如 `file.png` 则输入 'png'
     * @returns 返回具体数量; 若目标文件夹不存在则会创建, 并返回 0
     */
    getDirFilesCount(dirPath, fileType = '') {
        if (!this.isDirValid(dirPath)) {
            logger.warn(this.prefix, `directory path: ${dirPath} not valid`)
            return 0
        } else {
            if (fileType != '') {
                let fileTypeList = fs.readdirSync(dirPath).filter(file => file.endsWith(`.${fileType}`))
                return fileTypeList.length
            } else {
                let fileList = fs.readdirSync(dirPath)
                return fileList.length
            }
        }
    }

    /**
     * 创建文件夹
     * @param {*} dirPath 文件夹路径
     */
    makeDir(dirPath) {
        fs.mkdir(dirPath, (err) => { if (err) logger.warn(this.prefix, err) })
    }

    /**
     * 递归地创建文件夹
     * @param {*} dirPath 文件夹路径
     */
    makeFullDir(dirPath) {
        fs.mkdirSync(dirPath, { recursive: true })
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
     * 创建文件
     * @param {*} filePath 目标路径
     */
    touchFile(filePath, data = '') {
        fs.writeFile(filePath, data, (err) => { if (err) logger.warn(this.prefix, err) })
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
     * @param {*} app **app**.js
     * @param {*} func expend calss **func** extends plugin
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
            return yaml.load(fs.readFileSync(filePath, encoding))
        } else {
            return logger.warn(`${this.prefix} 找不到 ${filePath} 文件`)
        }
    }

    /**
     * 读取框架全局文件
     * @param {*} configType bot, group, other, qq, redis
     * @returns 
     */
    readGlobalYamlFile(configType, encoding = 'utf8') {
        let filePath = `./config/config/${configType}.yaml`
        if (this.isFileValid(filePath)) {
            return yaml.load(fs.readFileSync(filePath, encoding))
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
     * 将数据写入到目标文件
     * @param {*} filePath 目标文件路径, 若不存在将直接创建
     * @param {*} data 要写入的数据
     * @returns 
     */
    writeFile(filePath, data) {
        if (!this.isFileValid(filePath))
            this.touchFile(filePath)
        return fs.writeFileSync(filePath, data, 'utf8')
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
     * @param {*} app **app**.js
     * @param {*} func expend calss **func** extends plugin
     * @returns 
     */
    isFuncEnable(app, func) {
        let userConfigFile = `${this.userConfigDir}/index.config.yaml`
        if (!this.isFileValid(userConfigFile))
            return logger.warn(`${this.prefix} 配置文件 ${userConfigFile} 不存在`)

        let configs = this.readYamlFile('index', 'config')
        for (let _app in configs.apps) {
            for (let _func of configs.apps[_app]) {
                for (let __func in _func) {
                    if ((_app == app && __func == func))
                        return _func[__func]
                }
            }
        }
        return logger.error(`${this.prefix} 功能 ${app}.${func} 不存在, 跳过加载, 请检查文件 ${userConfigFile}`)
    }

    /**
     * 获取配置文件列表
     */
    getDefaultConfigFileList() {
        if (!this.isFileValid(`${this.defaultDir}/index.config.yaml`))
            return logger.info(`${this.prefix} 配置文件 ${this.defaultDir}/index.config.yaml 不存在`)

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
     * @param {*} app **app**.js
     * @param {*} func expend calss **func** extends plugin
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
     * @param {string} imgType 图像保存的类型(后缀名)
     * @param {*} headers 传入 { 'Referer': 'xxx', ...}
     * @param {*} method GET or POST
     */
    saveUrlImg(imgUrl, imgName, saveDirPath, imgType = 'png', headers = {}, method = 'GET') {
        let urlObject = new URL(imgUrl)
        let httpsOptions = {
            hostname: urlObject.hostname,
            path: urlObject.pathname,
            headers: headers,
            method: method
        }
        https.request(httpsOptions, (res) => {
            let imgData = ''
            res.setEncoding('binary')
            res.on('data', (chunk) => {
                imgData += chunk
            })
            let saveImgPath = `${saveDirPath}/${imgName}.${imgType}`
            if (!this.isDirValid(saveDirPath)) {
                this.makeFullDir(saveDirPath)
            }
            res.on('end', () => {
                fs.writeFile(saveImgPath, imgData, 'binary', (err) => {
                    if (err) logger.warn(`${this.prefix} 图片 ${imgUrl} 获取失败`)
                    else logger.info(`${this.prefix} 图片 ${imgUrl} 成功保存到 ${saveImgPath}`)
                })
            })
        }).end()
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
        let nickname = Bot.nickname,
            userInfo = {
                user_id: Bot.uin,
                nickname
            },
            forwardMsg = [{
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
     * @param {*} key 查看 tools.genRedisKey 生成的 key 在 redis 中剩余的时间, 单位是 s
     * 
     * 使用例：
     * ```javascript
     * // 这里的 tools.checkRedis() 在指定了 getKey 后, 返回 [bool, key]
     * await tools.ttlRedis(tools.checkRedis(..., {getKey: true})[1])
     * ```
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
    async isRedisSet(key) {
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
     * @param { object } e 传入 this.e
     * @param {'private' | 'group' | 'global'} type 
     * 
     * > 生成 redis key 的类型
     * > 
     * > 私人: [p, private, isPrivate],
     * > 
     * > 群: [g, group, isGroup],
     * > 
     * > 全局: [global, isGlobal]
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
            key += `.isPrivate`
        } else if (isGlobal) {
            key += `.isGlobal`
        }
        return key += `.${e.user_id}`
    }

    /**
     * 计算现在到目标时间剩余的秒数
     * @param {*} endTime 目标时间, 缺省是 '23:59:59', 即用于生成按日结算的 redis key
     * @returns 剩余时间, 单位是秒
     */
    calLeftTime(endTime = '23:59:59') {
        return moment(endTime, 'HH:mm:ss').diff(moment(), 'seconds')
    }

    /**
     * redis 中是否有过值, 有返回 true, 没有则返回 false
     * 
     * 使用例：
     * ```javascript
     * let cd = 2
     * let checkRedisResult
     * 
     * // 检查 this.e 的 isGlobal 是否存在, 若存在直接返回 true
     * // 若不存在, 返回 false, 并向 redis 里生成一个 this.e.logFnc.isGlobal.qq号 的 key
     * checkRedisResult = tools.checkRedis(this.e, 'global', cd)
     * 
     * // 检查 this.e 的 isGlabal 是否存在, 无论存在与否, 都会返回 查询到/新生成 的 [boolean, key] 列表
     * checkRedisResult = tools.checkRedis(this.e, 'global', cd, { getKey: true })
     * // 然后用返回的 key 查询该 key 剩余的时间等
     * tools.ttlRedis(checkRedisResult[1])
     * ```
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
     * @param {'hour' | 'minute'} timeFormat
     * > 时间单位, 默认是 hour
     * > 
     * > 小时: [h, hour],
     * > 
     * > 分钟: [m, min, minute],
     * > 
     * > 秒: else
     * @param {boolean} isMaster 是否开启主人不受限制
     * @param {boolean} getKey 是否获取生成的 key
     * @param {boolean} setRedis 是否同时向 redis 添加一个 key
     * @returns 返回值为 bool 或 [key, bool](if getKey == true)
     */
    async checkRedis(e, type, cd, options = {}) {

        let { value = moment().format('yyyy-MM-DD'), timeFormat = 'hour', isMaster = true, getKey = false, setRedis = true } = options

        let key = this.genRedisKey(e, type)

        if (e.isMaster && isMaster) return getKey == true ? [false, key] : false
        if (await this.isRedisSet(key)) return getKey == true ? [true, key] : true

        if (['h', 'hour'].includes(timeFormat)) {
            timeFormat = 60 * 60
        } else if (['m', 'min', 'minute'].includes(timeFormat)) {
            timeFormat = 60
        } else {
            timeFormat = 1
        }

        if (setRedis) this.setRedis(key, timeFormat * cd, value)
        return getKey == true ? [false, key] : false

    }

    /**
     * 判断是否存在特例设置
     * @param {*} caseId 特例名称, 例如群号, QQ 号
     * @param {*} app **app**.js
     * @param {*} func expend calss **func** extends plugin
     * @param {'config' | 'default'} type -config(默认), -default
     * @param {*} encoding 编码类型, 默认 utf8
     * @returns 存在与否
     */
    isCaseConfig(caseId, app, func, type = 'config', encoding = 'utf8') {
        let configFile = this.readYamlFile(app, func, type, encoding)
        for (let key of Object.keys(configFile)) {
            if (key == caseId)
                return true
        }
        return false
    }

    /**
     * 获取特例设置内容
     * @param {*} keyDict 想要取得的字典键值对集合, 
     * 
     * 使用例：
     * ```javascript
     * let keyDict = {
     *  botName: '',
     *  senderName: ''
     * }, groupId
     * // 返回特例设置内容, 如果没有特例, 则使用全局内容
     * keyDict = tools.applyCaseConfig(keyDict, groupId, 'chat', 'chat')
     * ```
     * @param {*} caseId 特例名称, 例如群号, QQ 号, 如果未找到值则使用全局设置
     * @param {*} app **app**.js
     * @param {*} func expend calss **func** extends plugin
     * @param {'config' | 'default'} type -config(默认), -default
     * @param {*} encoding 编码类型, 默认 utf8
     * @returns 
     */
    applyCaseConfig(keyDict, caseId, app, func, type = 'config', encoding = 'utf8') {
        let configFile = this.readYamlFile(app, func, type, encoding),
            groupConfig = configFile[caseId] ? configFile[caseId] : {}
        for (let key in keyDict) {
            keyDict[key] = groupConfig[key] != undefined ? groupConfig[key] : configFile[key]
        }
        return keyDict
    }

    /**
     * 编码：' ' => '%20'
     * @param {string} url 
     * @returns {string} 编码结果
     */
    encode(url) {
        return encodeURIComponent(url)
    }

    /**
     * 解码：'%20' => ' '
     * @param {string} url 
     * @returns {string} 解码结果
     */
    decode(url) {
        return decodeURIComponent(url)
    }

    /**
     * 查看对象的 键：值 属性
     * @param {Object} obj 
     * @returns 字典
     */
    checkObjectKeys(obj) {
        return Object.entries(obj)
    }

    /**
     * 查看对象所拥有的属性
     * @param {Object} obj 
     * @returns 
     */
    checkObjectProperties(obj) {
        return Object.getOwnPropertyNames(obj)
    }

    /**
     * 向指定目标转发消息
     * @param {*} type 类型: **Friend**, **Group**
     * @param {*} msg 要转发的消息
     * @param {*} target 转发目标
     * @param {*} from 来源
     * @param {*} Bot 传入 Bot
     * @returns 
     */
    async notify(type, msg, target, from, Bot) {
        if (!Bot) {
            return logger.warn(`${this.prefix} 请先传入 global.Bot`)
        }

        let _msg = [
            `[+] notify\n` +
            `来自 ${from} 的消息:\n` +
            `------------------\n`
        ]
        _msg.push(msg)
        _msg.push('\n------------------')

        switch (type) {
            case 'Friend':
                Bot.pickFriend(Number(target)).sendMsg(_msg)
                break;
            case 'Group':
                Bot.pickGroup(Number(target)).sendMsg(_msg)
                break;
            default:
                return logger.warn(`${this.prefix} invalid type!`)
        }
        return
    }

    /**
     * 用于检查 msg 中是否含有 at 的情况
     * @param {*} e 传入 this.e
     * @param {boolean} getDetail 默认是 false
     * > getDetail = flase, 返回 bool
     * 
     * > getDetail = true, 返回 [bool, atList]
     * @returns 
     */
    checkAt(e, getDetail = false) {
        let msg = e.message, atList = []
        for (let _msg of msg) {
            if (_msg['type'] == 'at') {
                atList.push(_msg)
            }
        }
        return getDetail ? [atList.length != 0, atList] : atList.length != 0
    }

    /**
     * 判断当前消息中, at 的 qq 号是否与传入的 qq 号相同
     * @param {*} e 传入 this.e
     * @param {int} cond 传入 qq 号
     * @returns 
     */
    isAtSomeone(e, cond) {
        let res = this.checkAt(e, true)
        if (!res[0]) return false
        for (let msg of res[1]) {
            if (msg['qq'] == cond) return true
        }
        return false
    }

    /**
	 * 使用控制台执行命令
     * 
     * 使用方法:
     * ```javascript
     * let execResult   // 返回的执行结果
     * let cmd = 'ls', args = ['-al', 'path/to/dir']    // 要执行的命令以及参数
     * tools.exec(cmd, args)
     *     .then((res) => { execResult = res })
     *     .catch((stderr) => { execResult = stderr })
     * tools.wait(1)    // 为了顺利执行命令, 建议进行等待
     * logger.info(execResult)
     * ```
	 * @param {*} cmd 要执行的命令
	 * @param {*} args 命令的可选参数, 列表形式
	 * @param {*} showCmd 是否打印所执行的命令
	 * @returns 
	 */
	exec(cmd, args, showCmd = false) {
        if (showCmd) {
            logger.info(this.prefix, `所执行命令: ${[cmd, ...args].join(' ')}`)
        }
		return new Promise((resolve, reject) => {
			let execResult = child_process.spawn(cmd, args)
			let stdout = '', stderr = '', res = []

			execResult.stdout.on('data', (data) => {
				stdout += data.toString()
			})


			execResult.stderr.on('data', (data) => {
				stderr += data.toString()
			})


			execResult.on('close', (code) => {
				res = [stdout, stderr, code]
				if (code !== 0) {
					reject(stderr)
				} else {
					resolve(res)
				}
			})

			execResult.on('error', (error) => {
				reject(error)
			})
		})
	}

}

export default new tools()