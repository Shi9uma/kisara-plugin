import { segment } from 'oicq'

import fetch from "node-fetch"
import tools from '../utils/tools.js'
import plugin from '../../../lib/plugins/plugin.js'

const pluginName = 'diy'


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
                        reg: '^(简报|新闻)$',
                        fnc: 'getTodayNews'
                    }
                ]
            }
        )
    }

    // this.task = {
    //     cron: tools.getConfig('schedule', 'config').scheduleTime,
    //     name: '每日简报定时推送任务',
    //     fnc: () => this.sendTodayNews(),
    //     log: true
    // }

    async checkResource(resName) {
        let newsImgDir = `./plugins/${this.pluginName}/data/todayNews`
        if (!tools.isDirValid(newsImgDir)) {    // 一般只有第一次使用会创建
            tools.makeDir(newsImgDir)
            return false
        }
        return tools.isResValid(newsImgDir, resName)
    }

    async getTodayNews() {
        // let url = 'http://bjb.yunwj.top/php/tp/lj.php'
        let url = 'http://dwz.2xb.cn/zaob'
        let response = await fetch(url).catch((err) => logger.info(err))

        if (response.status != 200) {
            await this.e.reply(`[+] 60s 读懂世界\n获取简报失败, 状态码 ${response.status}`)
            return
        }
        let newsImgTime = new Date()

        let res = await response.json()
        let newsImgUrl = res.imageUrl
        let msg = [
            segment.image(newsImgUrl)
        ]

        this.checkResource()
        this.e.reply(msg)
        return
    }

    async sendTodayNews() {
        let newsImgName
        let newsImgPath = `./data/todayNews/${newsImgName}.png`
        if (!tools.exists(newsImgName)) {
            this.getTodayNews()
        }
        return
    }

    async main() {
        let userConfigDirPath = path.join(`./plugins/$`,)
    }
}