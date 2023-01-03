import { segment } from 'oicq'

import lodash from 'lodash'
import moment from 'moment'
import fetch from "node-fetch"

import plugin from '../../lib/plugins/plugin.js'

import Apis from './data/apitoken.js'


const cd = 2    //所有命令的 cd，单位 小时
const apis = lodash.sample(Apis)

const codes = {
    130: 'API 调用频率超限',
    150: 'API 可用次数不足',
    190: '当前 key 已限制使用',
    200: '成功请求',
    230: 'key 错误或为空',
    250: '数据返回为空',
}

// 舔狗日记
export class tiangou extends plugin {
    constructor() {
        super({
            name: '舔狗',
            dsc: '舔狗日志',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: "^舔狗日志$",
                    fnc: 'tiangou'
                }
            ]
        })
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
        let apiUrl = 'https://apis.tianapi.com/tiangou/index?key=' + apis.tiangou
        apiUrl = encodeURI(apiUrl)
        let response = await fetch(apiUrl)
        let {code, msg, result} = await response.json()
        if(code != '200'){
            await this.reply(`[+] 舔狗日志：\n${codes[code]}`, true)
            return
        }
        await this.reply(`[+] 舔狗日志：\n${result.content}`, true)
    }
}

// 诗词美句
export class moodpoetry extends plugin {
    constructor() {
        super({
            name: '诗词',
            dsc: '诗词美句',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: "^(来点)?诗词(.*)$",
                    fnc: 'moodpoetry'
                }
            ]
        })
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
        const tiangou_key = this.e.logFnc + this.e.user_id
        const expireTime = await redis.get(tiangou_key)
        if (expireTime && this.time <= expireTime) {
            return false
        }
        const newExpireTime = moment().endOf('day').format('X')
        await redis.setEx(tiangou_key, 3600 * cd, newExpireTime)
        return true
    }

    async moodpoetry(e) {
        let valid = await this.checkUser()
        if (!valid) {
            this.reply(`你的诗词美句 cd 在冷却中(${cd}小时)`)
            return
        }
        let theme = {
            1: '离别',
            2: '人生',
            3: '生活',
            4: '四季'
        }
        let apiUrl = 'https://apis.tianapi.com/moodpoetry/index?key=' + apis.moodpoetry
        let searchMsg = e.msg.replace(/(来点诗词 )|(诗词 )/g, '')
        let flag = e.msg.indexOf('--theme')
        let type
        if (flag != -1) {
            type = e.msg.slice(flag + '--theme'.length + 1)
            flag = 1
        }
        else {
            type = null
            flag = 0
        }

        if (flag == 1){
            apiUrl += '&type=' + type
        }

        apiUrl = encodeURI(apiUrl)
        let response = await fetch(apiUrl)
        let {code, msg, result} = await response.json()
        if(code != '200'){
            await this.reply(`[+] 诗词美句：\n${codes[code]}`, true)
            return
        }
        let msgReply = [
            '  [+] 诗词美句：\n',
            `  主题：${theme[result.type]}\n`,
            `「${result.title}」 - ${result.author}\n`,
            `「${result.content}」\n`,
        ]
        await this.reply(msgReply, true)
    }
}
