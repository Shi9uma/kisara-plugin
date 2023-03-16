import plugin from '../../../lib/plugins/plugin.js'
import tools from '../utils/tools.js'

// 抽卡期望计算
export class gachaCalculator extends plugin {
    constructor() {
        super(
            {
                name: 'gachaCalculator',
                dsc: '根据输入数据计算抽卡期望',
                event: 'message',
                priority: 5000,
                rule: [
                    {
                        reg: '^#?计算抽卡期望(.*)$',
                        fnc: 'gachaCalculator'
                    }
                ]
            }
        )
        this.prefix = `[-] ${this.dsc}`
    }

    async gachaCalculator() {
        logger.info(this.prefix, this.e.msg)
        return
    }
}