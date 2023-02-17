
import fs from 'node:fs'
import YAML from 'yaml'
import chokidar from 'chokidar'

class Tools {
    constructor() {

        /** 插件文件夹名称 */
        this.pluginName = 'diy'

        /** 默认设置 */
        this.defaultPath = './default'
        this.defaultConfig = {}

        /** 用户设置 */
        this.configPath = './config'
        this.config = {}

        /** 监听文件 */
        this.watcher = { config: {}, defaultConfig: {} }
        this.ignore = ['schedule.config.Group1', 'schedule.config.Group2']
    }

    /** 监听配置文件 */
    watch(file, app, name, type = 'defaultConfig') {
        let key = `${app}.${name}`

        if (this.watcher[type][key]) return

        let watcher = chokidar.watch(file)
        watcher.on('change', path => {
            delete this[type][key]
            logger.mark(`[修改配置文件][${type}][${app}][${name}]`)
            if (this[`change_${app}${name}`]) {
                this[`change_${app}${name}`]()
            }
        })

        this.watcher[type][key] = watcher
    }

    getFilePath(app, name, type) {
        if (type == 'defaultConfig') return `${this.defaultPath}${app}/${name}.yaml`
        else return `${this.configPath}${app}.${name}.yaml`
    }

    /**
     * 获取配置yaml
     * @param app 功能
     * @param name 名称
     * @param type 默认跑配置-defSet，用户配置-config
     */
    getYaml(app, name, type) {
        let file = this.getFilePath(app, name, type)
        let key = `${app}.${name}`

        if (this[type][key]) return this[type][key]

        try {
            this[type][key] = YAML.parse(
                fs.readFileSync(file, 'utf8')
            )
        } catch (error) {
            logger.error(`[${app}][${name}] 格式错误 ${error}`)
            return false
        }

        this.watch(file, app, name, type)

        return this[type][key]
    }

    /**
     * @param app  功能
     * @param name 配置文件名称
     */
    getDefaultConfig(app, name) {
        return this.getYaml(app, name, 'defaultConfig')
    }

    /** 用户配置 */
    getConfig(app, name) {
        if (this.ignore.includes(`${app}.${name}`)) {
            return this.getYaml(app, name, 'config')
        }

        return { ...this.getDefaultConfig(app, name), ...this.getYaml(app, name, 'config') }
    }

    get element() {
        return { ...this.getDefaultConfig('element', 'role'), ...this.getDefaultConfig('element', 'weapon') }
    }

    saveBingCk(userId, data) {
        let file = `./data/MysCookie/${userId}.yaml`
        if (lodash.isEmpty(data)) {
            fs.existsSync(file) && fs.unlinkSync(file)
        } else {
            let yaml = YAML.stringify(data)
            fs.writeFileSync(file, yaml, 'utf8')
        }
    }

    /** 返回所有别名，包括用户自定义的 */
    getAllAbbr() {
        let nameArr = this.getDefaultConfig('role', 'name')
        let nameArrUser = this.getConfig('role', 'name')

        for (let i in nameArrUser) {
            let id = this.roleNameToID(i)
            nameArr[id] = nameArr[id].concat(nameArrUser[i])
        }

        return nameArr
    }

    getMsgUid(msg) {
        let ret = /[1|2|5-9][0-9]{8}/g.exec(msg)
        if (!ret) return false
        return ret[0]
    }

    cpCfg(app, name) {
        if (!fs.existsSync('./plugins/genshin/config')) {
            fs.mkdirSync('./plugins/genshin/config')
        }

        let set = `./plugins/genshin/config/${app}.${name}.yaml`
        if (!fs.existsSync(set)) {
            fs.copyFileSync(`./plugins/genshin/defaultConfig/${app}/${name}.yaml`, set)
        }
    }

    // diy

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
     * 返回读取的文件内容
     * @param {*} app 功能名称
     * @param {*} name 功能文件名称
     * @param {*} type 默认配置: defaultConfig, 用户自定义配置: config
     * @returns 
     */
    readYaml(app, name, type){
        let filePath = this.getFilePath(app, name, type)
        let flag = `${app}.${name}`

        if (this[type][flag])
            return this[type][flag]

        try {
            this[type][flag] = YAML.parse(
                fs.readFileSync(filePath, 'utf8')
            )
        } catch (err) {
            logger.error(`[${app}][${name}] 配置文件加载错误 ${err}`)
            return false
        }

        this.watch(filePath, app, name, type)
        return this[type][flag]
    }

}

export default new Tools()