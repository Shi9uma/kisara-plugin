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
                        fnc: 'getTodayNews'
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

    async checkTodayNewsImg(datatime) {
        if (!tools.isDirValid(newsImgDir))    // 一般只有第一次使用会创建
            tools.makeDir(newsImgDir)
        return tools.isFileValid(`${newsImgDir}/${datatime}.${this.imgType}`)
    }

    async getTodayNews(datatime) {
        logger.info('flag')
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
        if (newsImgName == datatime)
            tools.saveUrlImg(newsImgUrl, newsImgName, this.newsImgDir, this.imgType)
        else
            logger.info(`api 返回图片时间与日期不相符!`)

        return
    }

    async sendTodayNews() {
        let datatime = new moment().format('yyyy-MM-DD')
        if (!this.checkTodayNewsImg(datatime))
            tools.getTodayNews(datatime)
        let newsImgPath = `${this.newsImgDir}/${datatime}.${this.imgType}`
        let msg = [
            `[+] ${datatime} 简报\n`,
            segment.image(`file://${newsImgPath}`)
        ]
        this.e.reply(msg)
        return
    }
}