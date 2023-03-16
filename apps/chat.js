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
    }

    handleMessage(message, keyDict) {
        message = message.replaceAll('{me}', keyDict.botName)
        message = message.replaceAll('{name}', keyDict.senderName)
        let msgList
        if (message.includes('{segment}')) {
            msgList = message.split('{segment}')
        }
        return msgList ? msgList : [].concat(message)
    }

    dontAnswer(keyDict) {
        return (this.e.isMaster || lodash.random(1, 100) <= keyDict.triggerRate) ? false : true
    }

    async chat() {
        let keyDict = tools.applyCaseConfig({botName: '', senderName: '', triggerRate: ''}, this.e.group_id, 'chat', 'chat')
        if (this.dontAnswer(keyDict)) return

        let msg = this.e.raw_message,
            replyMsg,
            chatLibPath = `./plugins/${this.pluginName}/data/chatLibrary/lib/可爱系二次元bot词库1.5万词V1.2.json`,
            chatData = tools.readJsonFile(chatLibPath)

        for(let _msg in chatData) {
            if (msg == _msg) {
                replyMsg = this.handleMessage(lodash.sample(chatData[_msg]), keyDict)
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