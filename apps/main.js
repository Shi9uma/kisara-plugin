import { segment } from 'icqq'

import lodash from 'lodash'
import moment from 'moment'

import plugin from '../../../lib/plugins/plugin.js'
import tools from '../utils/tools.js'

import Foods from '../data/foods.js'

const content = [
    '占卜: 塔罗牌占卜\n',
    '今天吃什么: 选择困难\n',
    '舔狗日志: 最喜欢你了\n',
    '壁纸: 随机获得图片\n',
    '简报：发送每日简报\n',
    '风险：查询账号的风险值\n',
    '骰子: 「r + 数字」\n',
    '识图: 「识图 + 图片」, 「引用含有图片的消息并识图」\n',
    '点歌: 「点歌 + 歌曲名, 直接加歌手名以指定」\n'
]

// 查看属性
// var properties = Object.keys(this.e)

// 帮助
export class help extends plugin {
    constructor() {
        super({
            name: 'main_help',
            dsc: '发送自定义插件的 help',
            event: 'message',
            priority: 10,
            rule: [
                {
                    reg: '^ahelp$',
                    fnc: 'help'
                }
            ]
        })
    }

    async help() {
        await this.reply(content, false)
    }
}

// 撤回 bot 的消息
export class recall extends plugin {
    constructor() {
        super(
            {
                name: 'recall',
                dsc: '撤回 bot 的消息',
                event: 'message',
                priority: '100',
                rule: [
                    {
                        reg: '^(recall|撤回|撤)$',
                        fnc: 'recall'
                    }
                ]
            }
        )
    }

    async recall() {

        if (!((this.e.message[0].qq == Bot.uin) || (this.e.to_id == Bot.uin)))
            return

        if (!this.e.source) {
            await this.e.reply('请引用要撤回的消息', true, { recallMsg: 10 })
            return
        }

        if (this.e.isGroup) {
            if (!(this.e.group.is_admin || this.e.group.is_owner || this.e.isMaster)) {
                await this.e.reply('只接受管理员的撤回指令', true, { recallMsg: 10 })
                return
            }
        }

        if (this.e.source.user_id != Bot.uin) {
            await this.e.reply('无法撤回非本数字生命发的消息', true, { recallMsg: 10 })
            return
        }

        let isRecall
        let targetMsg
        if (this.e.isGroup) {
            targetMsg = (await this.e.group.getChatHistory(this.e.source.seq, 1)).pop()?.message_id
            isRecall = await this.e.group.recallMsg(targetMsg)
        } else {
            targetMsg = (await this.e.friend.getChatHistory(this.e.source.time, 1)).pop()?.message_id
            isRecall = await this.e.friend.recallMsg(targetMsg)
            logger.info(isRecall)
        }

        if (!isRecall)
            await this.e.reply('已超过消息撤回时限, 撤回失败', false, { recallMsg: 10 })
        return
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
                    reg: '^#?占卜$',
                    fnc: 'tarot'
                }
            ]
        })

        this.pluginName = tools.getPluginName()
        this.tarotCardsDirPath = `./plugins/${this.pluginName}/data/tarotCards`
        this.imgType = 'png'
        this.funcName = '[+] 塔罗牌占卜'
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

    async isPasseren() {
        if (this.e.isMaster) return true
        const tarot_key = this.e.logFnc + this.e.user_id
        const expireTime = await redis.get(tarot_key)
        if (expireTime && this.time <= expireTime) {
            return false
        }
        const newExpireTime = moment().endOf('day').format('X')
        await redis.setEx(tarot_key, 3600 * 24, newExpireTime)
        return true
    }

    /**
     * 获取塔罗牌数据
     * @param {*} type full or single
     * @returns full for [formation, cards_info_list, card], single for [card]
     */
    getTarotData(type) {
        let filePath = `${this.tarotCardsDirPath}/tarot.json`,
            tarotData = JSON.parse(tools.readFile(filePath)),   // 读取总数据
            all_cards = tarotData.cards,    // 读取所有卡片信息
            all_formations = tarotData.formations,   // 读取牌阵
            card = {
                name_cn: '',
                name_en: '',
                type: '',
                meaning: {
                    up: '',
                    down: ''
                },
                pic: ''
            }

        if (type == 'full') {
            // 牌阵数据
            let formation_name = lodash.sample(lodash.keys(all_formations)),
                formation = {
                    name: formation_name,
                    cards_num: all_formations[formation_name].cards_num,
                    is_cut: all_formations[formation_name].is_cut,
                    representations: lodash.sample(all_formations[formation_name].representations)
                },

                // 抽取牌数据
                cards_info_list = lodash.sampleSize(all_cards, formation.cards_num)

            return {formation, cards_info_list, card}
        } else if (type == 'single') {
            return lodash.sample(all_cards)
        } else {
            return logger.red('错误的塔罗牌占卜类型传入')
        }

    }

    async fullTarot() {
        let msg, msgArr = []
        let fullTarotData = this.getTarotData('full')
        let formation = fullTarotData.formation,
            cards_info_list = fullTarotData.cards_info_list,
            card = fullTarotData.card
        await this.e.reply(`${this.funcName}\n启用「${formation.name}」, 抽取 「${formation.cards_num}」张牌, 洗牌中...`)
        for (let index = 0; index < formation.cards_num; index++) {
            if (formation.is_cut && (index == formation.cards_num - 1))
                msg = `切牌「${formation.representations[index]}」,\n`
            else
                msg = `第「${index + 1}」张牌「${formation.representations[index]}」\n`

            card = cards_info_list[index]
            card.meaning = lodash.random(0, 1) ? ['正位', card.meaning.up] : ['逆位', card.meaning.down]
            card.pic = `file://${this.tarotCardsDirPath}/${card.type}/${card.pic}.${this.imgType}`

            msg += [
                `「${card.meaning[0]}」${card.name_cn},\n` +
                `回应是：${card.meaning[1]}`
            ]

            msgArr.push(msg)
            msgArr.push(segment.image(card.pic))
        }
        await this.e.reply(await (tools.makeForwardMsg(`对象：${this.e.sender.nickname ? this.e.sender.nickname : this.e.sender.card}`, msgArr, '塔罗牌占卜结束\n感谢开源代码来源：https://github.com/MinatoAquaCrews/nonebot_plugin_tarot', this.e, global.Bot)))
        return
    }

    async singleTarot() {
        let card = this.getTarotData('single'), msg, roll = lodash.random(0, 1)
        msg = [
            `${this.funcName}` +
            `\n「${roll ? '正位' : '逆位'}」${card.name_cn}` +
            `\n回应是：${roll ? card.meaning.up : card.meaning.down}`
        ]
        if (this.e.isGroup)
            await this.e.reply(`\n${msg}`, false, { at: true })
        else await this.e.reply(msg)
        await this.e.reply(segment.image(`file://${this.tarotCardsDirPath}/${card.type}/${card.pic}.${this.imgType}`))
        return
    }

    // 参考 https://github.com/MinatoAquaCrews/nonebot_plugin_tarot
    async tarot() {

        let isPasseren = await this.isPasseren()
        if (!isPasseren) {
            this.reply('今日已经为你占卜过了，明天再来吧')
            return
        }

        if (lodash.random(0, 10) == 5 || this.e.isMaster) {
            await this.e.reply('“许多傻瓜对千奇百怪的迷信说法深信不疑：象牙、护身符、黑猫、打翻的盐罐、驱邪、占卜、符咒、毒眼、塔罗牌、星象、水晶球、咖啡渣、手相、预兆、预言还有星座。”\n——《人类愚蠢辞典》')
            this.fullTarot()
            return
        } else {
            this.singleTarot()
            return
        }
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