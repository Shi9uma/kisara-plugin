import lodash from 'lodash'
import plugin from '../../../lib/plugins/plugin.js'
import tools from '../utils/tools.js'

const content = [
    '[+] 帮助菜单\n' + 
    '占卜: 塔罗牌占卜\n' + 
    '今天吃什么: 选择困难\n' + 
    '舔狗日志: 最喜欢你了\n' + 
    '壁纸: 随机获得图片\n' + 
    '简报：发送每日简报\n' + 
    '风险：查询账号的风险值\n' + 
    '骰子: 「r + 数字」\n' + 
    '识图: 「识图 + 图片」, 「引用含有图片的消息并识图」\n' + 
    '点歌: 「点歌 + 歌曲名, 直接加歌手名以指定」\n'
]

const pluginName = tools.getPluginName()

// ahelp
export class ahelp extends plugin {
    constructor() {
        super({
            name: 'ahelp',
            dsc: '发送自定义插件的 help',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '^ahelp$',
                    fnc: 'ahelp'
                }
            ]
        })
    }

    async ahelp() {
        await this.e.reply(content)
        return
    }
}

// recall
export class recall extends plugin {
    constructor() {
        super(
            {
                name: 'recall',
                dsc: '撤回 bot 的消息',
                event: 'message',
                priority: '5000',
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

// what2eat
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
                }
            ]
        })
        this.prefix = `[+] ${this.dsc}`
        this.foodsDataPath = `./plugins/${pluginName}/data/foods.json`
        this.foodsData = tools.readJsonFile(this.foodsDataPath)
    }

    async what2eat() {
        let result = lodash.sampleSize(this.foodsData, 5).join(' | ')
        await this.reply(`${this.prefix}\n推荐尝试：${result}`)
        return
    }
}

// roll
export class dice extends plugin {
    constructor() {
        super({
            name: 'dice',
            dsc: 'roll 骰子',
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

        this.prefix = `[+] ${this.dsc}`

    }

    async r() {
        let range = this.e.msg.split(' ').map(Number).filter(Number.isInteger)
        let end = range.pop() ?? 100
        let start = range.pop() ?? 1
        let result = lodash.random(start, end)
        await this.e.reply(`${this.prefix}\n在 ${start} 和 ${end} 间 roll 到了：${result}`)
        return
    }
}