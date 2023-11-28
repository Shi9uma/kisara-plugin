import { segment } from 'icqq'
import plugin from '../../../lib/plugins/plugin.js'
import tools from '../utils/tools.js'
import lodash from 'lodash'
import sharp from 'sharp'
import shuffleSeed from 'shuffle-seed'
import moment from 'moment'

const pluginName = tools.getPluginName()
const tarotSeedRefreshCd = 12   // 塔罗牌刷新 cd, 单位为小时
const hourInMillis = tarotSeedRefreshCd * 60 * 60 * 1000

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
                },
                {
                    reg: '^(刷新占卜|洗牌|refresh)$',
                    fnc: 'selfRefreshTarot'
                },
                {
                    reg: '^#(刷新占卜|洗牌|refresh)$',
                    fnc: 'refreshTarot',
                    permission: 'Master'
                }
            ]
        })

        this.tarotCardsDirPath = `./plugins/${pluginName}/data/tarotCards`
        this.imgType = 'png'
        this.prefix = `[+] ${this.dsc}`
    }

    async isPasseren() {
        let checkResult = await tools.checkRedis(this.e, 'global', tools.calLeftTime(), { timeFormat: 's' })
        if (checkResult) return false
        else return true
    }

    /**
     * 获取塔罗牌数据
     * @param {*} type full or single
     * @returns full for [formation, cards_info_list, card], single for [card]
     */
    getTarotData(type, seed = 0) {
        let filePath = `${this.tarotCardsDirPath}/tarot.json`,
            tarotData = tools.readJsonFile(filePath),   // 读取总数据
            allCards = tarotData.cards,    // 读取所有卡片信息
            allFormations = tarotData.formations,   // 读取牌阵
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
            let formation_name = lodash.sample(lodash.keys(allFormations)),
                formation = {
                    name: formation_name,
                    cards_num: allFormations[formation_name].cards_num,
                    is_cut: allFormations[formation_name].is_cut,
                    representations: lodash.sample(allFormations[formation_name].representations)
                },

                // 抽取牌数据
                cards_info_list = lodash.sampleSize(allCards, formation.cards_num)

            return { formation, cards_info_list, card }
        } else if (type == 'single') {
            let cardsList = []
            for (let item of tools.checkObjectKeys(allCards)) {
                cardsList.push(item[1])
            }
            return shuffleSeed.shuffle(cardsList, seed)[0]
        } else {
            return logger.warn('错误的塔罗牌占卜类型传入')
        }

    }

    async fullTarot() {
        let msg = [], msgArr = [], roll, imgBuffer
        let fullTarotData = this.getTarotData('full')
        let formation = fullTarotData.formation,
            cards_info_list = fullTarotData.cards_info_list,
            card = fullTarotData.card

        await this.e.reply(`${this.prefix}\n启用「${formation.name}」, 抽取 「${formation.cards_num}」张牌, 洗牌中...`)
        for (let index = 0; index < formation.cards_num; index++) {
            if (formation.is_cut && (index == formation.cards_num - 1))
                msg = [`切牌「${formation.representations[index]}」\n`]
            else
                msg = [`第「${index + 1}」张牌「${formation.representations[index]}」\n`]

            roll = lodash.random(0, 1)

            card = cards_info_list[index]
            card.meaning = roll ? ['正位', card.meaning.up] : ['逆位', card.meaning.down]

            if (card.pic.length > 1) {
                card.pic = lodash.sample(card.pic)
            }
            card.pic = `${this.tarotCardsDirPath}/${card.type}/${card.pic}.${this.imgType}`

            imgBuffer = sharp(card.pic)
            imgBuffer = roll ? await imgBuffer.toBuffer() : await imgBuffer.rotate(180).toBuffer()

            msg.push(`「${card.meaning[0]}」${card.name_cn}\n`)
            msg.push(`回应是: ${card.meaning[1]}\n`)
            msg.push(segment.image(imgBuffer))

            msgArr.push(msg)
        }

        await this.e.reply(tools.makeForwardMsg(`对象：${this.e.sender.card ? this.e.sender.card : this.e.sender.nickname}`, msgArr, '塔罗牌占卜结束\n感谢开源代码：MinatoAquaCrews/nonebot_plugin_tarot', this.e, global.Bot))
        return
    }

    async singleTarot() {

        function calSeed(seed) {
            let currentTimeStamp = moment().valueOf()
            let res = seed % Math.floor(currentTimeStamp / hourInMillis)
            return res
        }

        let seed = calSeed(this.e.sender.user_id),
            card = this.getTarotData('single', seed),
            msg,
            roll = shuffleSeed.shuffle([0, 1], seed)[0]
        msg = [
            `${this.prefix}\n`,
            `「${roll ? '正位' : '逆位'}」${card.name_cn}\n`,
            `回应是：${roll ? card.meaning.up : card.meaning.down}`
        ]

        if (card.pic.length > 1) {
            card.pic = lodash.sample(card.pic)
        }

        let tarotImgPath = `${this.tarotCardsDirPath}/${card.type}/${card.pic}.${this.imgType}`
        let imgBuffer = sharp(tarotImgPath)
        imgBuffer = roll ? await imgBuffer.toBuffer() : await imgBuffer.rotate(180).toBuffer()
        msg.push(segment.image(imgBuffer))

        await this.e.reply(msg, true)
        return
    }

    // 参考 https://github.com/MinatoAquaCrews/nonebot_plugin_tarot
    async tarot() {

        if (!(await this.isPasseren())) {
            await this.e.reply(`${this.prefix}\n今日已经为你占卜过了, 明天再来吧`, true)
            return
        }

        if (!tools.isDirValid(this.tarotCardsDirPath)) {
            tools.makeDir(this.tarotCardsDirPath)
            await this.e.reply(`${this.prefix}\n本地塔罗牌资源获取失败, 请阅读仓库中的 readme, 手动获取塔罗牌资源`)
            return
        }

        let configCase = tools.applyCaseConfig({ triggerFullTarot: '', triggerRate: '' }, this.e.group_id, 'tarot', 'tarot')

        if ((configCase.triggerFullTarot) && (this.e.isMaster || lodash.random(1, 100) <= configCase.triggerRate)) {
            await this.e.reply('“许多傻瓜对千奇百怪的迷信说法深信不疑：象牙、护身符、黑猫、打翻的盐罐、驱邪、占卜、符咒、毒眼、塔罗牌、星象、水晶球、咖啡渣、手相、预兆、预言还有星座。”\n——《人类愚蠢辞典》')
            this.fullTarot()
            return
        } else {
            this.singleTarot()
            return
        }
    }

    async selfRefreshTarot() {

        if (!(await this.isPasseren())) {
            await this.e.reply(`${this.prefix}\n每日只有一次愚弄命运之神的机会哦, 明天再来吧`, true)
            return
        }

        this.e.logFnc = this.e.logFnc.replace('[selfRefreshTarot]', '[tarot]')
        let deleteKey = tools.genRedisKey(this.e, 'global')
        let msg = `${this.prefix}\n`

        if ((await tools.isRedisSet(deleteKey) == null)) {
            msg += `对象 ${this.e.user_id} 还没有占卜过噢`
        } else {
            let deleteResult = await tools.delRedisKey(deleteKey)
            if (deleteResult) {
                msg += `已经为 ${this.e.user_id} 重新洗牌`
            } else {
                msg += `为 ${this.e.user_id} 重新洗牌失败, 请查看日志`
            }
        }

        await this.e.reply(msg, false, { recallMsg: 90 })
        return
    }

    async refreshTarot() {

        this.e.user_id = this.e.source.user_id
        this.e.logFnc = this.e.logFnc.replace('[refreshTarot]', '[tarot]')
        let deleteKey = tools.genRedisKey(this.e, 'global')
        let msg = `${this.prefix}\n`

        if ((await tools.isRedisSet(deleteKey) == null)) {
            msg += `对象 ${this.e.user_id} 还没有占卜过噢`
        } else {
            let deleteResult = await tools.delRedisKey(deleteKey)
            if (deleteResult) {
                msg += `已经为 ${this.e.user_id} 重新洗牌`
            } else {
                msg += `为 ${this.e.user_id} 重新洗牌失败, 请查看日志`
            }
        }

        await this.e.reply(msg, false, { recallMsg: 90 })
        return
    }
}