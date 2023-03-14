import { segment } from 'icqq'

import lodash from 'lodash'
import moment from 'moment'
import fetch from "node-fetch"
import axios from 'axios'

import plugin from '../../../lib/plugins/plugin.js'
import tools from '../utils/tools.js'

const cd = 1    //所有命令的 cd，单位 小时
const pluginName = tools.getPluginName()
const apis = JSON.parse(tools.readFile(`./plugins/${pluginName}/data/apitoken.json`))

const codes = {
    130: 'API 调用频率超限',
    150: 'API 可用次数不足',
    190: '当前 key 已限制使用',
    200: '成功请求',
    230: 'key 错误或为空',
    250: '数据返回为空',
}

const tags = {
    title: '标题',
    pixiv_id: 'pixiv id',
    member_name: 'pixiv 作者名',
    member_id: 'pixiv 作者id',
    danbooru_id: 'danbooru 索引id',
    gelbooru_id: 'gelbooru 索引id',
    creator: '作者',
    material: '主题',
    characters: '角色',
    source: '图片来源',
}

// 舔狗日记
export class tiangou extends plugin {
    constructor() {
        super({
            name: '舔狗日志',
            dsc: '舔狗日志',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: "^#?(舔狗日志|舔狗日记|舔狗|天狗|沸羊羊)$",
                    fnc: 'tiangou'
                }
            ]
        })

        this.prefix = `[+] ${this.name}`
    }

    get key() {
        /** 群，私聊分开 */
        if (this.e.isGroup) {
            return `${this.prefix}${this.e.group_id}:${this.e.user_id}`
        } else {
            return `${this.prefix}private:${this.e.user_id}`
        }
    }

    get time() {
        return moment().format('X')
    }

    async checkUser() {
        if (this.e.isMaster) return true
        const tiangou_key = this.e.logFnc + this.e.user_id
        const expireTime = await redis.get(tiangou_key)
        if (expireTime && this.time <= expireTime) {
            return false
        }
        const newExpireTime = moment().endOf('day').format('X')
        await redis.setEx(tiangou_key, 3600 * cd, newExpireTime)
        return true
    }

    async tiangou() {
        let valid = await this.checkUser()
        if (!valid) {
            this.reply(`你的舔狗日记 cd 在冷却中(${cd}小时)`)
            return
        }
        // let apiUrl = 'https://apis.tianapi.com/tiangou/index?key=' + apis.tiangou
        let apiUrl = 'https://cloud.qqshabi.cn/api/tiangou/api.php'
        let response = await axios.get(apiUrl).catch(async (err) => {
            await this.e.reply(`${this.prefix}：\n${err}`)
            return
        })

        if (response.status != '200') {
            await this.e.reply(`${this.prefix}：\n${res.msg}`, true)
            return
        }

        let res = response.data
        await this.e.reply(`${this.prefix}：\n${res}`, true)
        return
    }
}

// saucenao 识图
export class saucenao extends plugin {
    constructor() {
        super({
            name: '识图',
            dsc: '利用 saucenao.com 的 api 接口来识图',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '^#?(识图|搜图|出处|来源)$',
                    fnc: 'saucenaoCheckType'
                }
            ]
        })
        this.prefix = '[+] saucenao 识图'
    }

    async saucenaoSearch(numres = 3, similarityRate = 70) {

        if (apis.saucenao == '') {
            this.e.reply('未提供有效的 api_key，需要到 saucenao.com 获取 api_key')
            return
        }

        let saucenaoUrl = 'https://saucenao.com/search.php'
        let imgUrl = this.e.img[0]
        let response = await axios.get(
            saucenaoUrl,
            {
                params: {
                    url: imgUrl,
                    db: 999,
                    api_key: apis.saucenao,
                    output_type: 2,
                    numres: numres   // 返回多少个结果
                }
            }
        ).catch((error) => {
            if (error) {
                this.e.reply(`识图 api 无反应, 状态：${error}`, true, { recallMsg: 90 })
                logger.info(response)
                return
            }
        })

        let responseData = response.data.results
        let isSelectArr = []
        let msg

        for (let obj1 of responseData) {
            if (obj1.header.similarity >= similarityRate) {
                isSelectArr.push([obj1, obj1.header.similarity])
            }
        }

        if (isSelectArr.length == 0) {
            msg = [
                `${this.prefix}\n` + 
                `没有找到任何与提供图片相似度高于 ${similarityRate}% 的结果\n` + 
                `您也可以通过这个链接来自行查找.\n` + 
                `${saucenaoUrl + '?url=' + imgUrl}`
            ]
            await this.e.reply(msg, true)
            return
        }

        let forwardMsg = []
        let forwardMsgArr = []
        for (let obj2 of isSelectArr) {
            forwardMsg = [
                `[+] 识图结果 ${isSelectArr.indexOf(obj2) + 1}` + '\n'
            ]
            forwardMsg.push(`结果相似度: ${obj2[1]}%` + '\n')
            for (let objName in obj2[0].data) {
                if (objName == 'ext_urls') {
                    for (let url of obj2[0].data[objName]) {
                        forwardMsg.push(`当前识图结果链接 ${obj2[0].data[objName].indexOf(url) + 1}: ${url}` + '\n')
                    }
                }
                else {
                    if (tags[objName])
                        forwardMsg.push(`${tags[objName]}: ${obj2[0].data[objName]}` + '\n')
                    else
                        forwardMsg.push(`${objName}: ${obj2[0].data[objName]}` + '\n')
                }
            }
            forwardMsg.push(segment.image(`${obj2[0].header.thumbnail}`))
            forwardMsgArr.push(forwardMsg)
        }

        await this.e.reply(await (tools.makeForwardMsg(`${this.prefix}\n识图结果, 源链接：${saucenaoUrl + '?url=' + imgUrl}`, forwardMsgArr, `已列出所有相似度高于 ${similarityRate}% 的 ${isSelectArr.length} 条有效结果`, this.e, global.Bot)))
        await this.e.reply('识图结果已发送完毕, 如果没有消息记录, 则表示识图内容被风控', true, { recallMsg: 60 })
        return
    }

    // 主要逻辑
    async saucenaoCheckType(e) {
        try {
            // 防止滥用
            let checkPrivate = (this.e.isGroup || this.e.isMaster) ? true : false
            if (!checkPrivate) {
                this.e.reply('为防止滥用, 已禁止私聊使用')
                return
            }

            // 1. 带图查询模式
            if (this.e.img) {
                this.saucenaoSearch()
                return
            }

            // 2. 引用回复查询模式
            if (this.e.source) {

                let targetSource
                if (this.e.isGroup) {
                    targetSource = (await this.e.group.getChatHistory(this.e.source.seq, 1)).pop()?.message
                } else {
                    targetSource = (await this.e.friend.getChatHistory(this.e.source.time, 1)).pop()?.message
                }

                if (targetSource) {
                    for (let obj of targetSource) {
                        if (obj.type == 'image') {
                            this.e.img = [obj.url]
                            break
                        }
                    }
                }

                if (!this.e.img) {
                    await this.e.reply('引用目标没有图片可供查询', true)
                    return
                }

                this.saucenaoSearch()
                return
            }

            return



            // 3. 延时查询模式(未完成)
            let time
            if (this.e.isGroup) {
                time = 30
                this.reply(`请在 ${time}s 内发送想要识图的图片`)
            } else {
                time = 10
                this.reply(`请在 ${time}s 内发送想要识图的图片`)
            }

            /** 主循环计时 */
            setTimeout(() => {
                e.reply('操作超时已取消', true)
            }, time * 1000)
            return
        }
        catch (err) {
            logger.info(err)
            await this.e.reply('程序出错, 请查看日志')
            return
        }
    }
}

// ghser 随机图片
export class ghser extends plugin {
    constructor() {
        super(
            {
                name: '随机壁纸',
                dsc: '利用 ghser.com 的接口返回随机壁纸',
                event: 'message',
                priority: 5000,
                rule: [
                    {
                        reg: '^#?(来张壁纸|随机壁纸|壁纸)$',
                        fnc: 'ghser'
                    }
                ]
            }
        )

        this.prefix = `[+] 随机壁纸\n`
    }

    get key() {
        /** 群，私聊分开 */
        if (this.e.isGroup) {
            return `${this.prefix}${this.e.group_id}:${this.e.user_id}`
        } else {
            return `${this.prefix}private:${this.e.user_id}`
        }
    }

    get time() {
        return moment().format('X')
    }

    async checkUser() {
        if(this.e.isMaster) return true
        const ghser_key = this.e.logFnc + this.e.user_id
        const expireTime = await redis.get(ghser_key)
        if (expireTime && this.time <= expireTime) {
            return false
        }
        const newExpireTime = moment().endOf('day').format('X')
        await redis.setEx(ghser_key, 3600 * cd, newExpireTime)
        return true
    }

    async ghser() {
        if (!this.e.isMaster) {
            let isValid = await this.checkUser()
            if (!isValid) {
                this.e.reply('cd 冷却中', false, { at: true })
                return
            }
        }
        let apiUrl
        switch(lodash.random(1, 3)) {
            case 1:
                apiUrl = 'https://api.ghser.com/random/pe.php'
                break
            case 2:
                apiUrl = 'https://api.ghser.com/random/pc.php'
                break
            default:
                apiUrl = 'https://cloud.qqshabi.cn/api/images/api.php'
                break
        }
        logger.info(apiUrl)
        let response = await fetch(apiUrl).catch((error) => {if (error) logger.warn(error)})
        let msg = [
            `${this.prefix}` + 
            `${this.e.sender.card ? this.e.sender.card : this.e.sender.nickname} cd 剩余 ${cd} 小时\n`,
            segment.image(response.url)
        ]
        await this.e.reply(msg)
        return
    }

}

// 点歌
export class shareMusic extends plugin {
    constructor() {
        super({
            name: '点歌',
            dsc: '点歌系统',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: "^#?(点歌|来首|听歌|点首|bgm|BGM)(.*)$",
                    fnc: 'shareMusic'
                }
            ]
        })
    }

    async shareMusic(e) {
        let searchURL = "http://127.0.0.1:7894/search?keywords=paramsSearch"  // 网易云
        let msg = this.e.msg.replace(/#?(点歌|来首|听歌|点首|bgm|BGM)/g, "");
        try {
            msg = encodeURI(msg);
            let url = searchURL.replace("paramsSearch", msg);
            logger.info(url)
            let response = await fetch(url);
            let result = (await response.json()).result;
            let songList = result?.songs?.length ? result.songs : [];
            if (!songList[0]) {
                await this.e.sendMsg(`没有在网易云曲库中找到相应歌曲`);
                return true;
            }
            let songIndex = 0;
            if (this.e.isPrivate) {
                await this.e.friend.shareMusic("163", songList[songIndex].id);
            }
            else if (this.e.isGroup) {
                await this.e.group.shareMusic("163", songList[songIndex].id);
            }
        }
        catch (error) {
            if (error) logger.warn(error)
        }
        return true; //返回true 阻挡消息不再往下
    }
}

// 查看 QQ 账号风险值
export class riskValue extends plugin {
    constructor() {
        super({
            name: '账号风险值查询',
            dsc: '用于查询 QQ 账号的风险值',
            event: 'message',
            priority: 5000,
            rule: [
                { 
                    reg: "^#?(查询风险值|查风险|风险|封号概率|查询封号|封号|查封号)$",
                    fnc: 'riskValue'
                }
            ]
        })
    }

    async riskValue() {
        let searchURL = "http://tfapi.top/API/qqqz.php?type=json&qq=paramsSearch"  // 网易云
        try {
            let paramsSearch = this.e?.source?.user_id ? this.e.source.user_id : this.e.sender.user_id
            let url = searchURL.replace("paramsSearch", paramsSearch);
            logger.info(url)
            let response = (await fetch(url)), msg, result = (await response.json());
            if (result.code != 200) {
                msg = [
                    `Api 出错, 请重试\n`,
                    `状态码 ${result.code}`
                ]
                await this.e.reply(msg)
                return
            }
            msg = [
                `[+] 查询账号权值\n`,
                `QQ 号 ${paramsSearch} 的账号权值为 ${result?.qz}\n`,
                `tips: QQ 账号权值越高，tx 越给面子，相对较低时建议谨慎使用 QQ`
            ]
            await this.e.reply(msg, true)
        }
        catch (error) {
            if (error) logger.warn(error)
        }
        return true; //返回true 阻挡消息不再往下
    }    
}