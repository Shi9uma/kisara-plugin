import plugin from '../../lib/plugins/plugin.js'
import common from '../../lib/common/common.js'
import tools from '../diy/utils/tools.js'
import lodash from 'lodash'

export class chat extends plugin {
    constructor() {
        super(
            {
                name: '自机聊天',
                dsc: '自动匹配词库聊天功能',
                event: 'message',
                priority: 8000,
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
        this.botName = tools.readYamlFile('chat', 'chat').botName
    }

    handleMessage(message) {
        message = message.replace('{me}', this.botName)
        message = message.replace('{name}', this.senderName)
        if (message.includes('{segment}')) {
            let msgList = message.split('{segment}')
            return [true, msgList[0], msgList[1]]
        } else return [false, message, null]
    }

    async chat() {
        let msg = this.e.raw_message, replyMsg
        let chatLibPath = `./plugins/${this.pluginName}/data/chatLibrary/lib/傲娇系二次元bot词库5千词V1.2.json`,
            jsonData = tools.readJsonFile(chatLibPath)
        this.senderName = this.e.sender.card ? this.e.sender.card : this.e.sender.nickname
        for(let _msg in jsonData) {
            if (msg == _msg) {
                replyMsg = this.handleMessage(lodash.sample(jsonData[_msg]))
                if (replyMsg[0]) {
                    await this.e.reply(replyMsg[1])
                    common.sleep(5000)
                    await this.e.reply(replyMsg[2])
                } else {
                    await this.e.reply(replyMsg[1])
                }
            }
            else continue
        }
        return
    }
}