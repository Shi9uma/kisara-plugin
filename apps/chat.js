import plugin from '../../../lib/plugins/plugin.js'
import tools from '../utils/tools.js'
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
        this.configFile = tools.readYamlFile('chat', 'chat')
        this.botName = this.configFile.botName
        this.senderName = this.configFile.senderName
        this.triggerRate = this.configFile.triggerRate
    }

    handleMessage(message) {
        message = message.replaceAll('{me}', this.botName)
        message = message.replaceAll('{name}', this.senderName)
        let msgList
        if (message.includes('{segment}')) {
            msgList = message.split('{segment}')
        }
        return msgList ? msgList : [].concat(message)
    }

    dontAnswer() {
        if (this.e.isMaster || lodash.random(1, 100) < Number(this.triggerRate)) return false
        else return true
    }

    async chat() {
        if (this.dontAnswer()) return
        let msg = this.e.raw_message, replyMsg
        let chatLibPath = `./plugins/${this.pluginName}/data/chatLibrary/lib/可爱系二次元bot词库1.5万词V1.2.json`,
            jsonData = tools.readJsonFile(chatLibPath)
        if (this.senderName == '')
            this.senderName = this.e.sender.card ? this.e.sender.card : this.e.sender.nickname
        for(let _msg in jsonData) {
            if (msg == _msg) {
                replyMsg = this.handleMessage(lodash.sample(jsonData[_msg]))
                if (replyMsg.length >= 1) {
                    for (let eachMsg of replyMsg) {
                        await this.e.reply(eachMsg)
                        await tools.wait(lodash.random(1, 5))
                    }
                } else {
                    await this.e.reply(replyMsg[0])
                }
            }
            else continue
        }
        return
    }
}