import { segment } from 'oicq'

import fetch from "node-fetch"
import tools from '../utils/tools.js'
import plugin from '../../../lib/plugins/plugin.js'
import moment from 'moment'

const pluginName = tools.getPluginName()

export class todayNews extends plugin {
    constructor() {
        super(
            {
                name: '今日简报',
                dsc: '利用 api 返回每日日报',
                event: 'message',
                priority: 5000,
                rule: [
                    {
                        reg: '^(简报|新闻|日报)$',
                        fnc: 'sendTodayNews'
                    },
                    {
                        reg: '^删(除)?(今|日|今日|今天)?(简|日)?报$',
                        fnc: 'deleteTodayNews'
                    }
                ]
            }
        )

        this.imgType = 'png'
        this.newsImgDir = `./plugins/${pluginName}/data/todayNews`
    }

    // this.task = {
    //     cron: tools.getConfig('schedule', 'config').scheduleTime,
    //     name: '每日简报定时推送任务',
    //     fnc: () => this.sendTodayNews(),
    //     log: true
    // }

    isValidTime() {
        let datatime = new moment(new Date()).format('yyyy-MM-DD HH')
        let flagTime = moment(new Date()).format('yyyy-MM-DD')
        if (moment(datatime).isBetween(`${flagTime} 00`, `${flagTime} 08`)) return true
        else return false
    }

    checkTodayNewsImg(datatime) {
        if (!tools.isDirValid(this.newsImgDir))    // 一般只有第一次使用会创建
            tools.makeDir(this.newsImgDir)
        return tools.isFileValid(`${this.newsImgDir}/${datatime}.${this.imgType}`)
    }

    async checkKeepTime() {
        if (!(tools.isFileValid(tools.getConfigFilePath('schedule', 'todayNews', 'd')))) {
            let configDirPath = `./plugins/${tools.getPluginName()}/config`
            if (!(tools.isDirValid(configDirPath))) {
                tools.makeDir(configDirPath)
            }
            tools.copyConfigFile('schedule', 'todayNews')
        }
        if (!(tools.isDirValid(this.newsImgDir))) {
            tools.makeDir(this.newsImgDir)
        }
        let deleteFilePath
        let keepTime = tools.readYaml('schedule', 'todayNews', 'config').KeepTime
        let files = fs.readdirSync(this.newsImgDir).filter(file => file.endsWith('.png'))
        if (files.length > keepTime) {
            for (let count = 0; count < (files.length - keepTime); count++) {
                deleteFilePath = `${this.newsImgDir}/${files[count]}`
                await tools.deleteFile(deleteFilePath)
                logger.info(`已清除较早的简报资源: ${deleteFilePath}`)
            }
        }
    }

    async getTodayNews(datatime) {
        // let url = 'http://bjb.yunwj.top/php/tp/lj.php'
        let url = 'http://dwz.2xb.cn/zaob'
        let response = await fetch(url).catch((err) => logger.info(err))

        if (response.status != 200) {
            await this.e.reply(`[+] 60s 读懂世界\n获取简报失败, 状态码 ${response.status}`)
            return
        }

        let res = await response.json()
        let newsImgUrl = res.imageUrl
        let newsImgName = res.datatime
        tools.saveUrlImg(newsImgUrl, newsImgName, this.newsImgDir, this.imgType)
        return
    }

    async sendTodayNews() {
        let datatime = await new moment().format('yyyy-MM-DD')
        this.checkKeepTime()
        if (!this.checkTodayNewsImg(datatime)) {
            await this.getTodayNews(datatime)
            let msg
            if (!this.isValidTime()) {
                msg = `[+] ${datatime} 简报\n请注意, 当前时间点 ${new moment().format('yyyy-MM-DD HH:mm:ss')} 获取的简报信息可能有延误\n若出现延误内容, 请通过 删除简报 指令来刷新简报信息`
            } else {
                msg = `[+] ${datatime} 简报\n正在初始化今日简报信息, 请稍后重新获取`
            }
            await this.e.reply(msg)
            return
        } else {
            let newsImgPath = `${this.newsImgDir}/${datatime}.${this.imgType}`
            let msg = [
                `[+] ${datatime} 简报\n`,
                segment.image(`file://${newsImgPath}`)
            ]
            await this.e.reply(msg)
            return
        }
    }

    async deleteTodayNews() {
        if (!(this.e.group.is_admin || this.e.group.is_owner || this.e.isMaster)) {
            await this.e.reply('只接受管理员的简报删除指令', true, { recallMsg: 30 })
            return
        }
        let datatime = await new moment().format('yyyy-MM-DD')
        if (!this.checkTodayNewsImg(datatime)) {
            this.e.reply(`[+] 尚未获取 ${datatime} 简报`)
            return
        } else {
            let deleteNewsPath = `${this.newsImgDir}/${datatime}.${this.imgType}`
            await tools.deleteFile(deleteNewsPath)
            await this.e.reply(`[+] 已删除 ${datatime} 简报`)
            return
        }
    }
}