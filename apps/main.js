import lodash from 'lodash'
import plugin from '../../../lib/plugins/plugin.js'
import tools from '../utils/tools.js'

const content = [
    `[+] ${tools.getPluginName()} 帮助菜单\n` + 
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
                    reg: '^#?(roll|r|骰子|dice|色子)(.*)$',
                    fnc: 'roll'
                }
            ]
        })

        this.prefix = `[+] ${this.dsc}`

    }

    async roll() {
        let raw_message = this.e.raw_message.replace(/#?(roll|r|骰子|dice|色子)/g, ''),
            rangeList = raw_message.trim().split(' ').map(Number).filter(Number.isInteger),
            argCount = rangeList[0] == 0 ? 0 : rangeList.length,
            msg = `${this.prefix}\n`
        let start, end, count
        switch(argCount) {
            case 1:
                count = 1, end = rangeList.pop() ?? 100, start = 1
                msg += `在 ${start} 和 ${end} 中 roll 到了 ${lodash.random(start, end)}`
                break
            case 2:
                count = 1, end = rangeList.pop() ?? 100, start = rangeList.pop() ?? 1
                msg += `在 ${start} 和 ${end} 中 roll 到了 ${lodash.random(start, end)}`
                break
            case 3:
                count = rangeList.pop() ?? 1, end = rangeList.pop() ?? 100, start = rangeList.pop() ?? 1
                if (start > end) {
                    let temp = start
                    start = end, end = temp
                }
                let numList = new Array, i = start
                for (; i <= end; i++)
                    numList.push(i)
                numList = lodash.sampleSize(numList, count)
                msg += `在 ${start} 和 ${end} 中 roll 到了 ${numList.length} 个数: `
                for (let num of numList)
                    msg += `${num} `
                break
            default:
                msg += '参数非法\n' + 'e.g. r 100; r 1 100; r 1 100 3'
                break
        }

        await this.e.reply(msg)        
        return
    }
}