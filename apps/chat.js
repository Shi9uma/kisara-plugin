import plugin from '../../../lib/plugins/plugin.js'
import tools from '../utils/tools.js'
import lodash from 'lodash'
import similarity from 'string-similarity'

// 自机聊天
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

    async doReply(chatData, _msg, keyDict) {
        let replyMsg = this.handleMessage(lodash.sample(chatData[_msg]), keyDict)
        if (replyMsg.length >= 1) {
            for (let eachMsg of replyMsg) {
                await this.e.reply(eachMsg)
                await tools.wait(lodash.random(1, 5))
            }
        } else {
            await this.e.reply(replyMsg[0])
        }
        return
    }

    dontAnswer(keyDict, msg) {

        if (keyDict.ngWords.includes(msg)) return true  // ngWords 不回复
        if (keyDict.bans.includes(this.e.sender.user_id)) return true // ban 账号不回复
        return (this.e.isMaster || lodash.random(1, 100) <= keyDict.triggerRate) ? false : true // 触发概率及主人情况
    }

    async chat() {
        let keyDict = tools.applyCaseConfig({botName: '', senderName: '', triggerRate: '', similarityRate: '', ngWords: '', bans: ''}, this.e.group_id, 'chat', 'chat'),
            isCheckAt = tools.checkAt(this.e, true),
            msg = isCheckAt[0] ? this.e.raw_message.replaceAll(isCheckAt[1], '').replaceAll(keyDict.botName, '') : this.e.raw_message.replaceAll(keyDict.botName, '')

        if (this.dontAnswer(keyDict, msg)) return

        let chatLibPath = `./plugins/${this.pluginName}/data/chatLibrary/lib/可爱系二次元bot词库1.5万词V1.2.json`,
            chatData = tools.readJsonFile(chatLibPath)

        let similarityList = []        
        for (let _msg in chatData) {
            if (_msg == msg) {  // 词库中找到了键值对的情况
                await this.doReply(chatData, _msg, keyDict)
                return
            }
            let similarityRate = similarity.compareTwoStrings(_msg, msg)
            if (similarityRate * 100 >= Number(keyDict.similarityRate)) {
                similarityList.push({
                    similarityRate: similarityRate,
                    _msg: _msg,
                    msg: msg
                })
            }
        }

        if (similarityList.length > 0) {
            // 按照相似度从大到小排序, 取相似度最高的
            similarityList = lodash.orderBy(similarityList, ['similarityRate'], ['desc'])
            await this.doReply(chatData, similarityList[0]._msg, keyDict)
        }

        return
    }
}