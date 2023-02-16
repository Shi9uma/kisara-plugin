
import fs from 'node:fs'
import YAML from 'yaml'
import chokidar from 'chokidar'

class Tools {
    constructor() {
        /** 默认设置 */
        this.defSetPath = './config/default/'
        this.defSet = {}

        /** 用户设置 */
        this.configPath = './config/'
        this.config = {}

        /** 监听文件 */
        this.watcher = { config: {}, defSet: {} }

        this.ignore = ['schedule.config.Group1', 'schedule.config.Group2']
    }

    /** 监听配置文件 */
    watch(file, app, name, type = 'defSet') {
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
    getDefaultSet(app, name) {
        return this.getYaml(app, name, 'defSet')
    }

    /** 用户配置 */
    getConfig(app, name) {
        if (this.ignore.includes(`${app}.${name}`)) {
            return this.getYaml(app, name, 'config')
        }

        return { ...this.getDefaultSet(app, name), ...this.getYaml(app, name, 'config') }
    }

    getFilePath(app, name, type) {
        if (type == 'defSet') return `${this.defSetPath}${app}/${name}.yaml`
        else return `${this.configPath}${app}.${name}.yaml`
    }

    get element() {
        return { ...this.getDefaultSet('element', 'role'), ...this.getDefaultSet('element', 'weapon') }
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
        let nameArr = this.getDefaultSet('role', 'name')
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
            fs.copyFileSync(`./plugins/genshin/defSet/${app}/${name}.yaml`, set)
        }
    }

}

export default new Tools()