import plugin from '../../../lib/plugins/plugin.js'
import tools from '../utils/tools.js'
import lodash from 'lodash'
import similarity from 'string-similarity'
import axios from 'axios'

// 自机聊天
export class chat extends plugin {
    constructor() {
        super(
            {
                name: '自机聊天',
                dsc: '聊天 bot',
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
        this.prefix = `[+] ${this.name}`
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

    dontAnswer(keyDict, msg) {
        if (keyDict.ngWords.includes(msg)) return true  // ngWords 不回复
        if (keyDict.bans.includes(this.e.sender.user_id)) return true // ban 账号不回复
        return (this.e.isMaster || lodash.random(1, 100) <= keyDict.triggerRate || this.e.atme) ? false : true // 主人回复、触发概率情况以及 at 回复
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

    async chat() {
        let keyDict = tools.applyCaseConfig({ botName: '', senderName: '', triggerRate: '', similarityRate: '', ngWords: '', bans: '' }, this.e.group_id, 'chat', 'chat'),
            msg = this.e.atme ? this.e.original_msg.replaceAll(keyDict.botName, '') : this.e.raw_message.replaceAll(keyDict.botName, '')

        if (this.dontAnswer(keyDict, msg)) return

        let chatLibPath = `./plugins/${this.pluginName}/data/chatLibrary/lib/1.5w.json`,
            chatData = tools.readJsonFile(chatLibPath),
            similarityList = []

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

    async chatgpt() {   // 该功能因实际效果不理想, 已经弃用

        let msg = this.e.message[1].text
        if (this.e.img) return
        if (!(this.e.atme)) return

        let params = JSON.stringify({
            "model": "text-davinci-003",
            "prompt": msg,
            "max_tokens": 4000,
            "temperature": 0
        }),
            apiTokenPath = `./plugins/${this.pluginName}/data/apitoken.json`,
            api_key = tools.readJsonFile(apiTokenPath).chatgpt

        let config = {
            method: 'post',
            url: 'https://api.openai.com/v1/completions',
            headers: {
                'Authorization': `Bearer ${api_key}`,
                'Content-Type': 'application/json'
            },
            data: params
        }

        let response = await axios(config)

        await tools.wait(3)
        let gptResponseData = response.data.choices[0]
        await this.e.reply(gptResponseData.text.replace('\n', ''), true, { at: true })
        return
    }
}