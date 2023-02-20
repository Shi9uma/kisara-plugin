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

    checkTodayNewsImg(datatime) {
        if (!tools.isDirValid(this.newsImgDir))    // 一般只有第一次使用会创建
            tools.makeDir(this.newsImgDir)
        return tools.isFileValid(`${this.newsImgDir}/${datatime}.${this.imgType}`)
    }

    async getTodayNews(datatime) {
        // let url = 'http://bjb.yunwj.top/php/tp/lj.php'
        logger.info('flag')
        let url = 'http://dwz.2xb.cn/zaob'
        let response = await fetch(url).catch((err) => logger.info(err))

        logger.info(response)
        if (response.status != 200) {
            await this.e.reply(`[+] 60s 读懂世界\n获取简报失败, 状态码 ${response.status}`)
            return
        }

        let res = await response.json()
        let newsImgUrl = res.imageUrl
        let newsImgName = res.datatime
        logger.info(`简报 api 日期: ${res.datatime}, 本地日期: ${datatime}`)
        if (res.datatime == datatime)
            tools.saveUrlImg(newsImgUrl, newsImgName, this.newsImgDir, this.imgType)
        else
            logger.info(`api 返回图片时间与日期不相符!`)
        return
    }

    async sendTodayNews() {
        let datatime = await new moment().format('yyyy-MM-DD')
        if (!this.checkTodayNewsImg(datatime)) {
            await this.getTodayNews(datatime)
            this.sendTodayNews()
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
}