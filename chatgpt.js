import plugin from '../../lib/plugins/plugin.js'
import { ChatGPTAPI, getOpenAIAuth } from 'chatgpt'
import lodash from 'lodash'
import { Config } from './data/chatgptToken.js'
import showdown from 'showdown'
import mjAPI from 'mathjax-node'
import puppeteer from './utils/browser.js'
// import showdownKatex from 'showdown-katex'
const SESSION_TOKEN = Config.token
const blockWords = '屏蔽词1,屏蔽词2,屏蔽词3'
const converter = new showdown.Converter({
    extensions: [
        // showdownKatex({
        //   delimiters: [
        //     { left: '$$', right: '$$', display: false },
        //     { left: '$', right: '$', display: false, inline: true },
        //     { left: '\\(', right: '\\)', display: false },
        //     { left: '\\[', right: '\\]', display: true }
        //   ]
        // })
    ]
})
/**
 * 每个对话保留的时长。单个对话内ai是保留上下文的。超时后销毁对话，再次对话创建新的对话。
 * 单位：秒
 * @type {number}
 */
const CONVERSATION_PRESERVE_TIME = 600

mjAPI.config({
    MathJax: {
        // traditional MathJax configuration
    }
})
mjAPI.start()

let helpData = [
    {
        group: '聊天',
        list: [
            {
                icon: 'chat',
                title: '@我+聊天内容',
                desc: '与机器人聊天'
            },
            {
                icon: 'chat-private',
                title: '私聊与我对话',
                desc: '与机器人聊天'
            },
            {
                icon: 'picture',
                title: '#chatgpt图片模式',
                desc: '机器人以图片形式回答'
            },
            {
                icon: 'text',
                title: '#chatgpt文本模式',
                desc: '机器人以文本形式回答，默认选项'
            },

        ]
    },
    {
        group: '管理',
        list: [
            {
                icon: 'list',
                title: '#chatgpt对话列表',
                desc: '查询当前哪些人正在与机器人聊天'
            },
            {
                icon: 'destroy',
                title: '#结束对话',
                desc: '结束自己当前对话，下次开启对话机器人将遗忘掉本次对话内容。'
            },
            {
                icon: 'destroy-other',
                title: '#结束对话 @某人',
                desc: '结束该用户当前对话，下次开启对话机器人将遗忘掉本次对话内容。'
            },
            {
                icon: 'help',
                title: '#chatgpt帮助',
                desc: '获取本帮助'
            }
        ]
    }
]

export class ChatHelp extends plugin {
    constructor(e) {
        super({
            name: 'ChatGPT-Plugin帮助',
            dsc: 'ChatGPT-Plugin帮助',
            event: 'message',
            priority: 5002,
            rule: [
                {
                    reg: '^(#|[chatgpt|ChatGPT])*(命令|帮助|菜单|help|说明|功能|指令|使用说明)$',
                    fnc: 'help'
                }
            ]
        })
    }

    async help(e) {
        await e.runtime.render('chatgpt-plugin', 'help/index', { helpData })
    }
}

// 参考 https://github.com/ikechan8370/chatgpt-plugin.git
export class chatgpt extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: 'chatgpt',
            /** 功能描述 */
            dsc: 'chatgpt from openai',
            /** https://oicqjs.github.io/oicq/#events */
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 5000,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: '^chatgpt[^#][sS]*',
                    /** 执行方法 */
                    fnc: 'chatgpt'
                },
                {
                    reg: '#chatgpt对话列表',
                    fnc: 'getConversations',
                    permission: 'master'
                },
                {
                    reg: '^#结束对话([sS]*)',
                    fnc: 'destroyConversations'
                },
                // {
                //   reg: '#chatgpt帮助',
                //   fnc: 'help'
                // },
                {
                    reg: '#chatgpt图片模式',
                    fnc: 'switch2Picture'
                },
                {
                    reg: '#chatgpt文本模式',
                    fnc: 'switch2Text'
                }
            ]
        })
    }

    /**
     * 获取chatgpt当前对话列表
     * @param e
     * @returns {Promise<void>}
     */
    async getConversations(e) {
        let keys = await redis.keys('CHATGPT:CONVERSATIONS:*')
        if (!keys || keys.length === 0) {
            await this.reply('当前没有人正在与机器人对话', true)
        } else {
            let response = '当前对话列表：(格式为【开始时间 ｜ qq昵称 ｜ 对话长度 ｜ 最后活跃时间】)\n'
            await Promise.all(keys.map(async (key) => {
                let conversation = await redis.get(key)
                if (conversation) {
                    conversation = JSON.parse(conversation)
                    response += `${conversation.ctime} ｜ ${conversation.sender.nickname} ｜ ${conversation.num} ｜ ${conversation.utime} \n`
                }
            }))
            await this.reply(`${response}`, true)
        }
    }

    /**
     * 销毁指定人的对话
     * @param e
     * @returns {Promise<void>}
     */
    async destroyConversations(e) {
        let ats = e.message.filter(m => m.type === 'at')
        if (ats.length === 0) {
            let c = await redis.get(`CHATGPT:CONVERSATIONS:${e.sender.user_id}`)
            if (!c) {
                await this.reply('当前没有开启对话', true)
            } else {
                await redis.del(`CHATGPT:CONVERSATIONS:${e.sender.user_id}`)
                await this.reply('已结束当前对话，请@我进行聊天以开启新的对话', true)
            }
        } else {
            let at = ats[0]
            let qq = at.qq
            let atUser = lodash.trimStart(at.text, '@')
            let c = await redis.get(`CHATGPT:CONVERSATIONS:${qq}`)
            if (!c) {
                await this.reply(`当前${atUser}没有开启对话`, true)
            } else {
                await redis.del(`CHATGPT:CONVERSATIONS:${qq}`)
                await this.reply(`已结束${atUser}的对话，他仍可以@我进行聊天以开启新的对话`, true)
            }
        }
    }

    async help(e) {
        let response = 'chatgpt-plugin使用帮助文字版\n' +
            '@我+聊天内容: 发起对话与AI进行聊天\n' +
            '#chatgpt对话列表: 查看当前发起的对话\n' +
            '#结束对话: 结束自己或@用户的对话\n' +
            '#chatgpt帮助: 查看本帮助\n' +
            '源代码：https://github.com/ikechan8370/chatgpt-plugin'
        await this.reply(response)
    }

    async switch2Picture(e) {
        let userSetting = await redis.get(`CHATGPT:USER:${e.sender.user_id}`)
        if (!userSetting) {
            userSetting = { usePicture: true }
        } else {
            userSetting = JSON.parse(userSetting)
        }
        userSetting.usePicture = true
        await redis.set(`CHATGPT:USER:${e.sender.user_id}`, JSON.stringify(userSetting))
        await this.reply('ChatGPT回复已转换为图片模式')
    }

    async switch2Text(e) {
        let userSetting = await redis.get(`CHATGPT:USER:${e.sender.user_id}`)
        if (!userSetting) {
            userSetting = { usePicture: false }
        } else {
            userSetting = JSON.parse(userSetting)
        }
        userSetting.usePicture = false
        await redis.set(`CHATGPT:USER:${e.sender.user_id}`, JSON.stringify(userSetting))
        await this.reply('ChatGPT回复已转换为文字模式')
    }

    /**
     * #chatgpt
     * @param e oicq传递的事件参数e
     */
    async chatgpt(e) {
        if (!e.msg || e.msg.startsWith('#')) {
            return
        }
        if (e.isGroup && !e.atme) {
            return
        }
        let api = await redis.get('CHATGPT:API_OPTION')
        if (!api) {
            let browser = await puppeteer.getBrowser()
            const openAIAuth = await getOpenAIAuth((Config.username && Config.password)
                ? {
                    email: Config.username,
                    password: Config.password,
                    browser
                }
                : {
                    browser
                })
            const userAgent = await browser.userAgent()
            let config = { markdown: true, userAgent }
            let option
            if (Config.username && Config.password) {
                option = { ...Object.assign(config, openAIAuth) }
                this.chatGPTApi = new ChatGPTAPI(option)
            } else {
                config.sessionToken = Config.token
                option = { ...Object.assign(config, openAIAuth) }
                this.chatGPTApi = new ChatGPTAPI(option)
            }
            try {
                await this.chatGPTApi.ensureAuth()
                await redis.set('CHATGPT:API_OPTION', JSON.stringify(option))
            } catch (e) {
                logger.error(e)
                await this.reply(`OpenAI认证失败，请检查Token：${e}`, true)
                return
            }
        } else {
            let option = JSON.parse(api)
            this.chatGPTApi = new ChatGPTAPI(option)
            try {
                await this.chatGPTApi.ensureAuth()
            } catch (e) {
                let browser = await puppeteer.getBrowser()
                const openAIAuth = await getOpenAIAuth({
                    email: Config.username,
                    password: Config.password,
                    browserW
                })
                const userAgent = await browser.userAgent()
                let config = { markdown: true, userAgent }
                let option = { ...Object.assign(config, openAIAuth) }
                this.chatGPTApi = new ChatGPTAPI(option)
                try {
                    await this.chatGPTApi.ensureAuth()
                    await redis.set('CHATGPT:API_OPTION', JSON.stringify(option))
                } catch (e) {
                    logger.error(e)
                    await this.reply(`OpenAI认证失败，请检查Token：${e}`, true)
                    return
                }
            }
        }
        let question = e.msg.trimStart()
        await this.reply('我正在思考如何回复你，请稍等', true, { recallMsg: 5 })
        let c
        logger.info(`chatgpt question: ${question}`)
        let previousConversation = await redis.get(`CHATGPT:CONVERSATIONS:${e.sender.user_id}`)
        if (!previousConversation) {
            c = this.chatGPTApi.getConversation()
            let ctime = new Date()
            previousConversation = {
                sender: e.sender,
                conversation: c,
                ctime,
                utime: ctime,
                num: 0
            }
            await redis.set(`CHATGPT:CONVERSATIONS:${e.sender.user_id}`, JSON.stringify(previousConversation), { EX: CONVERSATION_PRESERVE_TIME })
        } else {
            previousConversation = JSON.parse(previousConversation)
            c = this.chatGPTApi.getConversation({
                conversationId: previousConversation.conversation.conversationId,
                parentMessageId: previousConversation.conversation.parentMessageId
            })
        }
        try {
            // console.log({ c })
            let response = await c.sendMessage(question)
            // console.log({c})
            // console.log(response)
            // 更新redis中的conversation对象，因为send后c已经被自动更新了
            await redis.set(`CHATGPT:CONVERSATIONS:${e.sender.user_id}`, JSON.stringify({
                sender: e.sender,
                conversation: c,
                ctime: previousConversation.ctime,
                utime: new Date(),
                num: previousConversation.num + 1
            }), { EX: CONVERSATION_PRESERVE_TIME })

            // 检索是否有屏蔽词
            const blockWord = blockWords.split(',').find(word => response.toLowerCase().includes(word.toLowerCase()))
            if (blockWord) {
                await this.reply('返回内容存在敏感词，我不想回答你', true)
                return
            }
            let userSetting = await redis.get(`CHATGPT:USER:${e.sender.user_id}`)
            if (userSetting) {
                userSetting = JSON.parse(userSetting)
            } else {
                userSetting = {
                    usePicture: false
                }
            }
            if (userSetting.usePicture) {
                let endTokens = ['.', '。', '……', '!', '！', ']', ')', '）', '】', '?', '？', '~', '"', "'"]
                while (!endTokens.find(token => response.trimEnd().endsWith(token))) {
                    // while (!response.trimEnd().endsWith('.') && !response.trimEnd().endsWith('。') && !response.trimEnd().endsWith('……') &&
                    //     !response.trimEnd().endsWith('！') && !response.trimEnd().endsWith('!') && !response.trimEnd().endsWith(']') && !response.trimEnd().endsWith('】')
                    // ) {
                    await this.reply('内容有点多，我正在奋笔疾书，请再等一会', true, { recallMsg: 5 })
                    const responseAppend = await c.sendMessage('Continue')
                    // console.log(responseAppend)
                    // 检索是否有屏蔽词
                    const blockWord = blockWords.split(',').find(word => responseAppend.toLowerCase().includes(word.toLowerCase()))
                    if (blockWord) {
                        await this.reply('返回内容存在敏感词，我不想回答你', true)
                        return
                    }
                    if (responseAppend.indexOf('conversation') > -1 || responseAppend.startsWith("I'm sorry")) {
                        logger.warn('chatgpt might forget what it had said')
                        break
                    }
                    // 更新redis中的conversation对象，因为send后c已经被自动更新了
                    await redis.set(`CHATGPT:CONVERSATIONS:${e.sender.user_id}`, JSON.stringify({
                        sender: e.sender,
                        conversation: c,
                        ctime: previousConversation.ctime,
                        utime: new Date(),
                        num: previousConversation.num + 1
                    }), { EX: CONVERSATION_PRESERVE_TIME })

                    response = response + responseAppend
                }
                // logger.info(response)
                // markdown转为html
                // todo部分数学公式可能还有问题
                let converted = converter.makeHtml(response)

                /** 最后回复消息 */
                await e.runtime.render('chatgpt-plugin', 'content/index', { content: converted, question, senderName: e.sender.nickname })
            } else {
                await this.reply(`${response}`, e.isGroup)
            }
        } catch (e) {
            logger.error(e)
            await this.reply(`与OpenAI通信异常，请稍后重试：${e}`, true, { recallMsg: e.isGroup ? 10 : 0 })
        }
    }
}
