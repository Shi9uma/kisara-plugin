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
        this.keyDict = tools.applyGroupConfig({botName: '', senderName: '', triggerRate: ''}, this.group_id, 'chat', 'chat')
    }

    handleMessage(message) {
        message = message.replaceAll('{me}', this.keyDict.botName)
        message = message.replaceAll('{name}', this.keyDict.senderName)
        let msgList
        if (message.includes('{segment}')) {
            msgList = message.split('{segment}')
        }
        return msgList ? msgList : [].concat(message)
    }

    dontAnswer() {
        let b = Number(this.keyDict.triggerRate)
        let a = (this.e.isMaster || lodash.random(1, 100) < b) ? false : true
        logger.warn(a, b)
        return a
    }

    async chat() {
        if (this.dontAnswer()) return

        let msg = this.e.raw_message,
            replyMsg,
            chatLibPath = `./plugins/${this.pluginName}/data/chatLibrary/lib/可爱系二次元bot词库1.5万词V1.2.json`,
            chatData = tools.readJsonFile(chatLibPath)

        for(let _msg in chatData) {
            if (msg == _msg) {
                replyMsg = this.handleMessage(lodash.sample(chatData[_msg]))
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