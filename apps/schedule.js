import { segment } from 'icqq'

import fs from 'fs'
import fetch from "node-fetch"
import tools from '../utils/tools.js'
import plugin from '../../../lib/plugins/plugin.js'
import common from '../../../lib/common/common.js'
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
                    },
                    {
                        reg: '^推送今日简报$',
                        fnc: 'scheduleSendTodayNews'
                    }
                ]
            }
        )

        this.imgType = 'png'
        this.newsImgDir = `./plugins/${pluginName}/data/todayNews`
        this.configYaml = tools.readYamlFile('schedule', 'todayNews')
        this.datatime = new moment().format('yyyy-MM-DD')
        this.prefix = `[+] ${this.name}`

        this.task = {
            cron: this.configYaml.scheduleTime,
            name: '每日简报定时推送',
            fnc: () => this.scheduleSendTodayNews(),
            log: true
        }

    }

    isValidTime() {
        let datatime = new moment(new Date()).format('yyyy-MM-DD HH')
        let flagTime = moment(new Date()).format('yyyy-MM-DD')
        if (!moment(datatime).isBetween(`${flagTime} 00`, `${flagTime} 08`)) return true
        else return false
    }

    checkTodayNewsImg(datatime) {
        if (!tools.isDirValid(this.newsImgDir))    // 一般只有第一次使用会创建
            tools.makeDir(this.newsImgDir)
        return tools.isFileValid(`${this.newsImgDir}/${datatime}.${this.imgType}`)
    }

    deleteTodayNews() {
        let checkPrivate = (this.e.isGroup || this.e.isMaster) ? true : false
        if (!checkPrivate) {
            if (!this.e.isMaster)
                this.e.reply('为了防止滥用, 仅支持群聊使用', true, { recallMsg: 30 })
            return
        }
        if (this.e.isGroup) {
            if (!(this.e.group.is_admin || this.e.group.is_owner || this.e.isMaster)) {
                this.e.reply('只接受管理员的简报删除指令', true, { recallMsg: 30 })
                return
            }
        }
        let datatime = this.datatime
        if (!this.checkTodayNewsImg(datatime)) {
            this.e.reply(`[+] 尚未获取 ${datatime} 简报`)
            return
        } else {
            let deleteNewsPath = `${this.newsImgDir}/${datatime}.${this.imgType}`
            tools.deleteFile(deleteNewsPath)
            this.e.reply(`[+] 已删除 ${datatime} 简报`)
            return
        }
    }

    async checkKeepTime() {
        if (!(tools.isFileValid(tools.getConfigFilePath('schedule', 'todayNews', 'c')))) {
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
        let keepTime = this.configYaml.KeepTime
        let files = fs.readdirSync(this.newsImgDir).filter(file => file.endsWith('.png'))
        if (files.length > keepTime) {
            for (let count = 0; count < (files.length - keepTime); count++) {
                deleteFilePath = `${this.newsImgDir}/${files[count]}`
                await tools.deleteFile(deleteFilePath)
                logger.info(`已清除较早的简报资源: ${deleteFilePath}`)
            }
        }
    }

    async getTodayNews() {
        // let url = 'http://bjb.yunwj.top/php/tp/lj.php'
        let url = 'http://dwz.2xb.cn/zaob'
        let response = await fetch(url).catch((error) => {if (error) logger.warn(this.prefix, error)})

        if (response.status != 200) {
            await this.e.reply(`${this.prefix}\n获取简报失败, 状态码 ${response.status}`)
            return
        }

        let res = await response.json()
        let newsImgUrl = res.imageUrl
        let newsImgName = res.datatime
        tools.saveUrlImg(newsImgUrl, newsImgName, this.newsImgDir, this.imgType)
        return
    }

    async sendTodayNews() {
        let datatime = this.datatime
        this.checkKeepTime()
        if (!this.checkTodayNewsImg(datatime)) {
            this.getTodayNews(datatime)
            let msg
            if (!this.isValidTime()) {
                msg = `[+] ${datatime} 简报\n正在初始化今日简报信息, 请再次输入获取简报指令\n请注意, 当前时间点 ${new moment().format('yyyy-MM-DD HH:mm:ss')} 获取的简报信息可能有延误\n若出现延误内容, 请通过 删除简报 指令来刷新简报信息`
            } else {
                msg = `[+] ${datatime} 简报\n正在初始化今日简报信息, 请再次输入获取简报指令`
            }
            await this.e.reply(msg)
            return
        } else {
            let newsImgPath = `${this.newsImgDir}/${datatime}.${this.imgType}`
            let msg = [
                `${this.prefix}\n` +
                `日期：${this.datatime}\n`,
                segment.image(`file://${newsImgPath}`)
            ]        
    
            await this.e.reply(msg)
            return
        }
    }

    async scheduleSendTodayNews() {
        if(!this.checkTodayNewsImg(this.datatime)) {
            this.getTodayNews(this.datatime)
            await tools.wait(5)
        }

        let newsImgPath = `${this.newsImgDir}/${this.datatime}.${this.imgType}`
        let msg = [
            `[+] ${this.task.name}\n` +
            `日期：${this.datatime}\n`,
            segment.image(`file://${newsImgPath}`)
        ]        

        let scheduleGroups = this.configYaml.scheduleGroups
        for(let group_id of scheduleGroups) {
            Bot.pickGroup(Number(group_id)).sendMsg(msg)
        }
        return 
    }
}