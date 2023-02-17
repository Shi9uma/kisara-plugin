import { segment } from 'oicq'

import fetch from "node-fetch"
import tools from '../utils/tools.js'
import plugin from '../../../lib/plugins/plugin.js'

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

    async getTodayNews() {
        let url = 'http://bjb.yunwj.top/php/tp/lj.php'
        let response = await fetch(url).catch((err) => logger.info(err))

        if (response.status != 200) {
            await this.e.reply(`[+] 60s 读懂世界\n获取简报失败, 状态码 ${response.status}`)
            return
        }
        let newsImgTime = new Date()

        let res = await response.json()
        let newsImgUrl = res.tp
        let msg = [
            segment.image(newsImgUrl)
        ]
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
}