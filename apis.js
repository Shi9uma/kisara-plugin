import { segment } from 'oicq'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { ChatGPTAPI } from 'chatgpt'

import lodash from 'lodash'
import moment from 'moment'
import fetch from "node-fetch"
import axios from 'axios'

import plugin from '../../lib/plugins/plugin.js'
import puppeteer from '../../lib/puppeteer/puppeteer.js'

import kauChim_cards from './data/kauChim.js'
import tarot_cards from './data/tarot.js'
import Foods from './data/foods.js'
import feiyangyangMSG from './data/feiyangyang.js'

import screenshot from './utils/screenshot.js'


const cd = 20    //所有命令的 cd

// 舔狗日记
export class feiyangyang extends plugin {
    constructor() {
        super({
            name: '舔狗',
            dsc: '舔狗日志',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: "^舔狗日志$",
                    fnc: 'feiyangyang'
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
        const feiyangyang_key = this.e.logFnc + this.e.user_id
        const expireTime = await redis.get(feiyangyang_key)
        if (expireTime && this.time <= expireTime) {
            return false
        }
        const newExpireTime = moment().endOf('day').format('X')
        await redis.setEx(feiyangyang_key, 3600 * 24, newExpireTime)
        return true
    }

    async feiyangyang() {
        let valid = await this.checkUser()
        if (!valid) {
            this.reply('今日已经为你发过舔狗日志了噢')
            return
        }
        const Feiyangyang = feiyangyangMSG
        const result = lodash.sample(Feiyangyang)
        await this.reply(` 每日舔狗日志：\n${result}`, false, { at: true })
    }
}