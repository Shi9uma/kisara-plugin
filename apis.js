import lodash from 'lodash'
import moment from 'moment'
import fetch from "node-fetch"
import axios from 'axios'

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
        let { code, msg, result } = await response.json()
        if (code != '200') {
            await this.reply(`[+] 舔狗日志：\n${codes[code]}`, true)
            return
        }
        await this.reply(`[+] 舔狗日志：\n${result.content}`, true)
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
                    reg: '^#?识图测试$',
                    fnc: 'saucenaoCheckType'
                }
            ]
        })
    }

    async saucenaoSearch(e) {

        if (apis.saucenao == '') {
            e.reply('未提供有效的 api_key')
            return
        }

        let imgUrl = e.img[0]
        let response = await axios.get(
            'https://saucenao.com/search.php',
            {
                params: {
                    url: imgUrl,
                    db: 999,
                    api_key: apis.saucenao,
                    output_type: 2,
                    numres: 3
                }
            }
        ).catch((error) => {
            if (error) {
                e.reply(`识图 api 无反应, 状态：${error}`, true)
                logger.info(response)
                return
            }
        })
        let responseData = response.data.results
        logger.info(responseData)
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
                this.saucenaoSearch(e)
                return
            }

            // 2. 回复查询模式
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
                    await this.e.reply('引用目标没有图片可供查询', true, 110)
                    return
                }

                this.saucenaoSearch(e)
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
        }
    }
}