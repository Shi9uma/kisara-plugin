import { segment } from 'icqq'
import plugin from '../../../lib/plugins/plugin.js'
import tools from '../utils/tools.js'
import lodash from 'lodash'

const pluginName = tools.getPluginName()

// tarot
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

        this.tarotCardsDirPath = `./plugins/${pluginName}/data/tarotCards`
        this.imgType = 'png'
        this.prefix = `[+] ${this.dsc}`
    }

    async isPasseren() {
        let checkResult = await tools.checkRedis(this.e, 'global', tools.calLeftTime(), {timeFormat: 's'})
        if (checkResult) return false
        else return true
    }

    /**
     * 获取塔罗牌数据
     * @param {*} type full or single
     * @returns full for [formation, cards_info_list, card], single for [card]
     */
    getTarotData(type) {
        let filePath = `${this.tarotCardsDirPath}/tarot.json`,
            tarotData = tools.readJsonFile(filePath),   // 读取总数据
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
            return logger.warn('错误的塔罗牌占卜类型传入')
        }

    }

    async fullTarot() {
        let msg, msgArr = []
        let fullTarotData = this.getTarotData('full')
        let formation = fullTarotData.formation,
            cards_info_list = fullTarotData.cards_info_list,
            card = fullTarotData.card
        await this.e.reply(`${this.prefix}\n启用「${formation.name}」, 抽取 「${formation.cards_num}」张牌, 洗牌中...`)
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
        await this.e.reply(await (tools.makeForwardMsg(`对象：${this.e.sender.card ? this.e.sender.card : this.e.sender.nickname}`, msgArr, '塔罗牌占卜结束\n感谢开源代码：MinatoAquaCrews/nonebot_plugin_tarot', this.e, global.Bot)))
        return
    }

    async singleTarot() {
        let card = this.getTarotData('single'), msg, roll = lodash.random(0, 1)
        msg = [
            `${this.prefix}\n` +
            `「${roll ? '正位' : '逆位'}」${card.name_cn}\n` +
            `回应是：${roll ? card.meaning.up : card.meaning.down}`
        ]
        if (this.e.isGroup) {
            await this.e.reply(`\n${msg}`, false, { at: true })
        } else { 
            await this.e.reply(msg)
        }
        await this.e.reply(segment.image(`file://${this.tarotCardsDirPath}/${card.type}/${card.pic}.${this.imgType}`))
        return
    }

    // 参考 https://github.com/MinatoAquaCrews/nonebot_plugin_tarot
    async tarot() {

        if (!(await this.isPasseren())) {
            this.e.reply(`\n${this.prefix}\n今日已经为你占卜过了，明天再来吧`, false, {at: true})
            return
        }

        if (this.e.isMaster || lodash.random(1, 100) <= tools.applyCaseConfig({triggerRate: ''}, this.e.group_id, 'tarot', 'tarot').triggerRate) {
            await this.e.reply('“许多傻瓜对千奇百怪的迷信说法深信不疑：象牙、护身符、黑猫、打翻的盐罐、驱邪、占卜、符咒、毒眼、塔罗牌、星象、水晶球、咖啡渣、手相、预兆、预言还有星座。”\n——《人类愚蠢辞典》')
            this.fullTarot()
            return
        } else {
            this.singleTarot()
            return
        }
    }
}