import { segment } from 'icqq'

import fs from 'fs'
import fetch from "node-fetch"
import tools from '../utils/tools.js'
import plugin from '../../../lib/plugins/plugin.js'
import moment from 'moment'
import userAgent from 'user-agents'
import axios from 'axios'
import jsdom from 'jsdom'

const pluginName = tools.getPluginName()

// 今日简报
export class todayNews extends plugin {
    constructor() {
        super(
            {
                name: '今日简报',
                dsc: '今日简报',
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
                        reg: '^推送(今|每)日简报$',
                        fnc: 'scheduleSendTodayNews',
                        permission: 'Master'
                    }
                ]
            }
        )

        this.imgType = 'png'
        this.newsImgDir = `./plugins/${pluginName}/data/todayNews`
        this.configYaml = tools.readYamlFile('schedule', 'todayNews')
        this.datatime = new moment().format('yyyy-MM-DD')
        this.prefix = `[+] ${this.dsc}`
        this.headers = this.generateNewHeaders()

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
        if (!moment(datatime).isBetween(`${flagTime} 01`, `${flagTime} 08`)) return true
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
                this.e.reply(`${this.prefix}\n为了防止滥用, 仅支持群聊使用`, true, { recallMsg: 30 })
            return
        }
        if (this.e.isGroup) {
            if (!(this.e.group.is_admin || this.e.group.is_owner || this.e.isMaster)) {
                this.e.reply(`${this.prefix}\n只接受管理员的简报删除指令`, true, { recallMsg: 30 })
                return
            }
        }
        let datatime = this.datatime
        if (!this.checkTodayNewsImg(datatime)) {
            this.e.reply(`${this.prefix}\n尚未获取日期为 ${datatime} 的简报`)
            return
        } else {
            let deleteNewsPath = `${this.newsImgDir}/${datatime}.${this.imgType}`
            tools.deleteFile(deleteNewsPath)
            this.e.reply(`${this.prefix}\n已删除日期为 ${datatime} 的简报`)
            return
        }
    }

    generateNewHeaders() {
        return {
            'Accept': 'text/html, application/xhtml+xml, application/xml; q=0.9, image/webp, image/apng, */*; q=0.8, application/signed-exchange; v=b3; q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN, zh; q=0.9, en; q=0.8',
            'User-Agent': new userAgent().toString()
        }
    }

    selectSingleElement(reg, dom) {
        return dom.window.document.querySelector(reg)
    }

    selectAllElement(reg, dom) {
        return dom.window.document.querySelectorAll(reg)
    }

    getArticleIndex(dom, queryStringList) {
        let author = queryStringList[0], title = queryStringList[1], count = 0, flag = -1
        let tempDom = this.selectAllElement('ul.news-list li', dom)
        tempDom.forEach((item) => {
            count += 1
            let itemDom = new jsdom.JSDOM(item.innerHTML),
                _title = this.selectSingleElement('div.txt-box a', itemDom).textContent,
                _author = this.selectSingleElement('div.txt-box div a', itemDom).textContent

            if (author == _author && title == _title) flag = count
        })
        return flag
    }

    async generateCookies() {
        let url = 'https://weixin.sogou.com/'
        let response = (await axios.get(url = url, { headers: this.generateNewHeaders() }))
        return response.headers['set-cookie']
    }

    async getHtmlData(url) {
        let response
        await axios.get(
            url = url,
            {
                headers: this.headers
            }
        ).then((_response) => {
            response = _response
        }).catch((err) => {
            if (err) logger.warn(err)
        })

        let responseUrl = response.request.res.responseUrl

        if (responseUrl.includes('antispider')) {
            let antispiderHtmlDom = new jsdom.JSDOM(response.data)
            let _captchaImgUrl = this.selectSingleElement('#seccodeImage', antispiderHtmlDom).src
            let captchaImgUrl = `https://weixin.sogou.com/antispider/${_captchaImgUrl}`
            let saveDirPath = `./plugins/${this.pluginName}/dontgit/`

            logger.warn(captchaImgUrl)
            tools.saveUrlImg(captchaImgUrl, 'captchaImg', saveDirPath, 'png')
        }
        return response.data
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
                logger.info(`[-] ${this.prefix} 已清除较早的简报资源: ${deleteFilePath}`)
            }
        }
    }

    async getTodayNews() {
        // let url = 'http://bjb.yunwj.top/php/tp/lj.php'
        let url = 'http://dwz.2xb.cn/zaob'
        let response = await fetch(url).catch((error) => { if (error) logger.warn(this.prefix, error) })

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

    async getTodayNewsPlus() {

        let cookies = await this.generateCookies()
        let datatime = (new moment().format('yyyy-MM-DD')).split('-')
        datatime.forEach((element) => {
            datatime[datatime.indexOf(element)] = parseInt(element, 10).toString()
        })
        let queryStringList = [`易即今日`, `今日简报(${datatime[1]}月${datatime[2]}日)`]
        // queryStringList = [`易即今日`, `今日简报(4月11日)`]
        let key = `${queryStringList[0]}.${queryStringList}`
        let imgUrl = await tools.getRedis(key)
        if (imgUrl) return imgUrl

        // 获取今日简报 url
        let searchUrl = `https://weixin.sogou.com/weixin?ie=utf8&type=2&query=${queryStringList[0]}${queryStringList[1]}`
        let searchHtmlData = await this.getHtmlData(searchUrl, cookies)
        await tools.wait(2)

        let searchHtmlDom = new jsdom.JSDOM(searchHtmlData),
            articleIndex = this.getArticleIndex(searchHtmlDom, queryStringList)
        if (articleIndex == -1) return false    // 没有相应文章, 直接返回 false

        let imgWebUrl = tools.decode(this.selectSingleElement(`ul.news-list li:nth-child(${articleIndex}) div:nth-child(2) a`, searchHtmlDom).href)
        if (!imgWebUrl) return false

        // 获取今日简报
        imgWebUrl = `https://weixin.sogou.com${imgWebUrl}`
        let imgWebHtmlData = await this.getHtmlData(imgWebUrl, cookies)
        // [imgWebHtmlStatus, imgWebHtmlData] = [200, tools.readFile('./plugins/kisara/dontgit/imgWebHtml.html')]
        await tools.wait(2)

        // 访问图片并保存
        let pattern = /cdn_url: '(.*)',/g
        let newsImgUrl = pattern.exec(imgWebHtmlData)[1]
        let newsImgName = this.datatime
        tools.saveUrlImg(newsImgUrl, newsImgName, this.newsImgDir, this.imgType)
        await tools.wait(2)
        if (this.checkTodayNewsImg(new moment().format('yyyy-MM-DD'))) {
            logger.warn('获取今日简报: ', datatime, queryStringList, searchUrl, imgWebUrl, newsImgUrl)
            tools.setRedis(key, tools.calLeftTime(), newsImgUrl)
        }

        return true
    }

    async sendTodayNews() {
        let datatime = this.datatime,
            msg = [
                `${this.prefix}\n` +
                `日期：${this.datatime}\n`
            ],
            tempMsg = [].concat(msg)
        await this.checkKeepTime()

        if (!this.checkTodayNewsImg(datatime)) {
            // if (!(await this.getTodayNewsPlus()))
            this.getTodayNews()

            if (!this.isValidTime()) {
                tempMsg.push(`正在初始化今日简报信息, 稍等...`)
                tempMsg.push(`\n请注意, 当前时间点 ${new moment().format('yyyy-MM-DD HH:mm:ss')} 获取的简报信息可能有延误\n若出现延误内容, 请通过 删除简报 指令来刷新简报信息`)
            } else {
                tempMsg.push(`正在初始化今日简报信息, 稍等...`)
            }
            await this.e.reply(tempMsg)
            await tools.wait(10)
        }

        if (!this.checkTodayNewsImg(datatime)) return
        msg.push(segment.image(`file://${this.newsImgDir}/${datatime}.${this.imgType}`))
        await this.e.reply(msg)
        return
    }

    async scheduleSendTodayNews() {
        let datatime = new moment().format('yyyy-MM-DD')
        if (!this.checkTodayNewsImg(datatime)) {
            // if (!(await this.getTodayNewsPlus()))
            this.getTodayNews()
            await tools.wait(10)
        }

        let newsImgPath = `${this.newsImgDir}/${datatime}.${this.imgType}`,
            msg = [
                `[+] ${this.task.name}\n` +
                `日期：${datatime}\n`,
                segment.image(`file://${newsImgPath}`)
            ]

        let scheduleGroups = tools.readYamlFile('schedule', 'todayNews').scheduleGroups
        for (let group_id of scheduleGroups) {
            Bot.pickGroup(Number(group_id)).sendMsg(msg)
        }
        return
    }
}