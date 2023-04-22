import lodash from 'lodash'
import plugin from '../../../lib/plugins/plugin.js'
import tools from '../utils/tools.js'

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
                },
                {
                    reg: '^.ra(.*)$',
                    fnc: 'trpg'
                },
                {
                    reg: '^\.r\d+d\d+^',
                    fnc: 'trpg'
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
                msg += `在 ${start} 到 ${end} 中 roll 到了 ${lodash.random(start, end)}`
                break
            case 2:
                count = 1, end = rangeList.pop() ?? 100, start = rangeList.pop() ?? 1
                if (start > end) {
                    let temp = start
                    start = end, end = temp
                }
                msg += `在 ${start} 到 ${end} 中 roll 到了 ${lodash.random(start, end)}`
                break
            case 3:
                count = (rangeList.pop() ?? 1), end = rangeList.pop() ?? 100, start = rangeList.pop() ?? 1
                if (start > end) {
                    let temp = start
                    start = end, end = temp
                }
                let numList = new Array, i = start
                for (; i <= end; i++)
                    numList.push(i)
                if (count > 30) {
                    count = 30
                    msg += `roll 骰子个数过多, 自动减少为 30 个\n`
                }
                numList = lodash.sampleSize(numList, count)
                msg += `在 ${start} 到 ${end} 中 roll 到了 ${numList.length} 个数: \n`
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

    async trpg() {
        return
    }
}