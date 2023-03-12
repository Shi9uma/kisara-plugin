import plugin from '../../../lib/plugins/plugin.js'
import tools from '../utils/tools.js'

export class chat extends plugin {
    constructor() {
        super(
            {
                name: '自机聊天',
                dsc: '自动匹配词库聊天功能',
                event: 'message',
                priority: 9000,
                rule: [
                    {
                        reg: '^(.*)$',
                        fnc: 'chat',
                        log: false
                    }
                ]
            }
        )

        this.pluginName = tools.getPluginName()
    }

    checkPermission() {
        
    }

    async chat() {
        logger.warn('test1')
    }
}