import { segment } from 'oicq'

import lodash from 'lodash'
import moment from 'moment'
import fetch from "node-fetch"

import plugin from '../../lib/plugins/plugin.js'

import kauChim_cards from './data/kauChim.js'
import tarot_cards from './data/tarot.js'
import Foods from './data/foods.js'

var content = [
    '求签：鸣神大社抽签\n',
    '占卜：塔罗牌占卜\n',
    '今天吃什么：选择困难就试试这个\n',
    '舔狗日志：来点舔狗日志\n',
    '骰子：「r + 数字」\n',
    '识图：「识图 + 图片」\n',
    '点歌：「点歌 + 歌曲名，--singer 指定歌手」\n'
]

// 查看属性
// var properties = Object.keys(this.e)

// 帮助
export class Help extends plugin {
    constructor() {
        super({
            name: 'main_help',
            dsc: '发送自定义插件的 help',
            event: 'message',
            priority: 10,
            rule: [
                {
                    reg: '^help$',
                    fnc: 'help'
                }
            ]
        })
    }

    async help() {
        await this.reply(content, false)
    }
}

// 求签
export class kauChim extends plugin {
    constructor() {
        super({
            name: 'kauChim',
            dsc: '求签',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '^#?(抽签|求签|御神签)(\\s|$)',
                    fnc: 'kauChim'
                }
            ]
        })
        this.prefix = 'L:other:kauChim:'
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
        const expireTime = await redis.get(this.key)
        if (expireTime && this.time <= expireTime) {
            return false
        }
        const newExpireTime = moment().endOf('day').format('X')
        await redis.setEx(this.key, 3600 * 24, newExpireTime)
        return true
    }

    async kauChim() {
        const card = lodash.sample(kauChim_cards)
        const valid = await this.checkUser()
        if (!valid) {
            this.reply('（今天已经抽过了，明天再来看看吧…）')
            return
        }
        let msg = `${card?.name}\n${card?.dsc}`
        if (this.e.isGroup) {
            msg = '\n' + msg
        }
        await this.reply(msg, false, { at: true })
        if (card?.item) {
            this.reply(card?.item)
        }
    }
}

// 占卜
export class tarot extends plugin {
    constructor() {
        super({
            name: 'tarot',
            dsc: '塔罗牌',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '^#?占卜',
                    fnc: 'tarot'
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
        const tarot_key = this.e.logFnc + this.e.user_id
        const expireTime = await redis.get(tarot_key)
        if (expireTime && this.time <= expireTime) {
            return false
        }
        const newExpireTime = moment().endOf('day').format('X')
        await redis.setEx(tarot_key, 3600 * 24, newExpireTime)
        return true
    }

    async tarot() {

        let card = lodash.sample(tarot_cards)
        let name = card.name_cn
        let isUp = lodash.random(0, 1)
        let valid = await this.checkUser()
        if (!valid) {
            this.reply('今日已经为你占卜过了，明天再来吧')
            return
        }

        let banner = lodash.random(0, 10)
        if (banner == 5) {
            await this.reply('“许多傻瓜对千奇百怪的迷信说法深信不疑：象牙、护身符、黑猫、打翻的盐罐、驱邪、占卜、符咒、毒眼、塔罗牌、星象、水晶球、咖啡渣、手相、预兆、预言还有星座。”\n——《人类愚蠢辞典》')
        }

        await this.reply(
            `\n「${isUp ? '正位' : '逆位'}」${name}\n回应是：${isUp ? card.meaning.up : card.meaning.down}`, false, { at: true }
        )

        // 参考 https://github.com/MinatoAquaCrews/nonebot_plugin_tarot
        let path = './plugins/diy/data/tarot_resource'
        let pic = segment.image(`file://${path}/${card.type}/${card.pic}`)
        await this.reply(pic)
    }
}

// 今天吃什么
export class what2eat extends plugin {
    constructor() {
        super({
            name: 'what2eat',
            dsc: '今天吃什么',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '^#?咱?(今天|明天|[早中午晚][上饭餐午]|早上|夜宵|今晚)吃(什么|啥|点啥)',
                    fnc: 'what2eat'
                },
                {
                    reg: '^#?添加食物',
                    fnc: 'addFood'
                },
                {
                    reg: '^#?删除食物',
                    fnc: 'deleteFood'
                }
            ]
        })
    }

    getKey() {
        return `Yz:what2eat:foods:${this.e.group_id}`
    }

    async addFood() {
        if (!this.e.isGroup) {
            return await this.reply('请群聊发送')
        }
        const key = this.getKey()
        const foods = this.e.msg.split(' ').filter(Boolean).slice(1)
        foods.forEach(async (food) => {
            await redis.sAdd(key, food)
        })
        await this.reply(`添加了${foods.length}个群特色食物...`)
    }

    async deleteFood() {
        if (!this.e.isGroup) {
            return await this.reply('请群聊发送')
        }
        const key = this.getKey()
        const foods = this.e.msg.split(' ').filter(Boolean).slice(1)
        foods.forEach(async (food) => {
            await redis.sRem(key, food)
        })
        await this.reply(`已经尝试删除${foods.length}个群特色食物...`)
    }

    async what2eat() {
        let food = Foods
        if (this.e.isGroup) {
            const key = this.getKey()
            const groupFood = await redis.sMembers(key)
            food = this.e.msg.split(' ')[0]?.includes('咱')
                ? groupFood
                : [...Foods, ...groupFood]
        }

        if (!food || food.length == 0) return

        const result = lodash.sampleSize(food, 4).join('|')
        await this.reply(`🌟推荐尝试：${result}`, false, { at: true })
    }
}

// 骰子
export class dice extends plugin {
    constructor() {
        super({
            name: 'roll',
            dsc: 'roll骰子',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '^#?roll ',
                    fnc: 'roll'
                },
                {
                    reg: '^#?r ',
                    fnc: 'r'
                }
            ]
        })
    }

    async r() {
        const range = this.e.msg.split(' ').map(Number).filter(Number.isInteger)
        const end = range.pop() ?? 100
        const start = range.pop() ?? 1
        const result = lodash.random(start, end)
        await this.reply(`在 ${start} 和 ${end} 间roll到了：${result}`)
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
                    reg: "^点歌(.*)$",
                    fnc: 'shareMusic'
                }
            ]
        })
    }

    async shareMusic(e) {
        let searchURL = "http://127.0.0.1:7894/search?keywords=paramsSearch"  // 网易云
        let msg = e.msg.replace(/(点歌 )|(点歌)/g, "");
        let flag = e.msg.indexOf("--singer");
        let singer;
        if (flag != -1) {
            singer = e.msg.slice(flag + "--singer".length + 1)
            msg = msg.slice(0, flag - 4)
            flag = 1
        }
        else {
            singer = null
            flag = 0
        }

        try {
            msg = encodeURI(msg);
            const params = { search: msg };
            let url = searchURL.replace("paramsSearch", msg);
            logger.info(url)
            let response = await fetch(url);
            const { data, result } = await response.json();
            let songList = result?.songs?.length ? result.songs : [];
            if (!songList[0]) {
                await e.reply(`没有找到该歌曲哦(仅支持网易云)`);
                return true;
            }

            let songIndex = 0;
            let tempReg = '(' + singer + ')';
            if (flag == 1) {
                for (; songIndex < result.songs.length; songIndex++) {
                    if (songList[songIndex].artists[0].name.match(tempReg) != null) {
                        break;
                    }
                }
                if (songIndex >= result.songs.length) {
                    await e.reply(`没有找到该指定歌手对应的歌曲哦(尝试正确拼写歌手名)`);
                    return true;
                }
            }

            if (e.isPrivate) {
                await e.friend.shareMusic("163", songList[songIndex].id);
            }
            else if (e.isGroup) {
                await e.group.shareMusic("163", songList[songIndex].id);
                /** 使用 ffmpeg 转换成语音
                let response = await fetch(`https://autumnfish.cn/song/url?id=${songList[0].id}`);
                const { data } = await response.json();
                if (!data[0].url) return true;
                await e.reply(segment.record(data[0].url));
                */
            }
        }
        catch (error) {
            console.log(error);
        }
        return true; //返回true 阻挡消息不再往下
    }
}

// 抽卡期望计算
export class gachaSupport extends plugin {
    constructor() {
        super(
            {
                name: 'gachaSupport',
                dsc: '根据输入数据计算抽卡期望',
                event: 'message',
                priority: 5000,
                rule: [
                    {
                        reg: '^#?计算抽卡期望(.*)$',
                        fnc: 'gachaSupport'
                    }
                ]
            }
        );
    }

    async gachaSupport(e) {
        
        logger.info('[用户命令]', e.msg)
        let msg
        let arg
    }
}