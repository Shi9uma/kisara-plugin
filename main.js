import { segment } from 'oicq'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { AuthType, createClient } from "webdav"

import lodash from 'lodash'
import moment from 'moment'
import katex from 'katex'
import fetch from "node-fetch"
import axios from 'axios'

import plugin from '../../lib/plugins/plugin.js'
import puppeteer from '../../lib/puppeteer/puppeteer.js'

import kauChim_cards from './data/kauChim.js'
import tarot_cards from './data/tarot.js'
import Foods from './data/foods.js'

import screenshot from './utils/screenshot.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const cd = 20    //所有命令的 cd

var content = [
    '求签：鸣神大社抽签\n',
    '占卜：塔罗牌占卜\n',
    '观音灵签：这是你的第三次求签机会\n',
    '二次元的我：生成一个二次元形象\n',
    '今天吃什么：选择困难就试试这个\n',
    '骰子：「r/roll + 数字」\n',
    'latex：「latex + tex语句」\n',
    '识图：「识图 + 图片」\n',
    '点歌：「点歌 + 歌曲名，--singer 指定歌手」'
]

// 帮助
export class Help extends plugin {
    constructor() {
        super({
            name: 'main_help',
            dsc: '发送自定义插件的 help',
            event: 'message',
            priority: 10,
            rule: [
                {
                    reg: '^help$',
                    fnc: 'help'
                }
            ]
        })
    }

    async help() {
        await this.reply(content, false)
    }
}

// 求签
export class kauChim extends plugin {
    constructor() {
        super({
            name: 'kauChim',
            dsc: '求签',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '^#?(抽签|求签|御神签)(\\s|$)',
                    fnc: 'kauChim'
                }
            ]
        })
        this.prefix = 'L:other:kauChim:'
    }

    get key() {
        /** 群，私聊分开 */
        if (this.e.isGroup) {
            return `${this.prefix}${this.e.group_id}:${this.e.user_id}`
        } else {
            return `${this.prefix}private:${this.e.user_id}`
        }
    }

    get time() {
        return moment().format('X')
    }

    async checkUser() {
        const expireTime = await redis.get(this.key)
        if (expireTime && this.time <= expireTime) {
            return false
        }
        const newExpireTime = moment().endOf('day').format('X')
        await redis.setEx(this.key, 3600 * 24, newExpireTime)
        return true
    }

    async kauChim() {
        const card = lodash.sample(kauChim_cards)
        const valid = await this.checkUser()
        if (!valid) {
            this.reply('（今天已经抽过了，明天再来看看吧…）')
            return
        }
        let msg = `${card?.name}\n${card?.dsc}`
        if (this.e.isGroup) {
            msg = '\n' + msg
        }
        await this.reply(msg, false, { at: true })
        if (card?.item) {
            this.reply(card?.item)
        }
    }
}

// 占卜
export class tarot extends plugin {
    constructor() {
        super({
            name: 'tarot',
            dsc: '塔罗牌',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '^#?占卜',
                    fnc: 'tarot'
                }
            ]
        })
    }

    get key() {
        /** 群，私聊分开 */
        if (this.e.isGroup) {
            return `${this.prefix}${this.e.group_id}:${this.e.user_id}`
        } else {
            return `${this.prefix}private:${this.e.user_id}`
        }
    }

    get time() {
        return moment().format('X')
    }

    async checkUser() {
        const expireTime = await redis.get(this.key)
        if (expireTime && this.time <= expireTime) {
            return false
        }
        const newExpireTime = moment().endOf('day').format('X')
        await redis.setEx(this.key, 3600 * 24, newExpireTime)
        return true
    }

    async tarot() {

        let card = lodash.sample(tarot_cards)
        let name = card.name_cn
        let isUp = lodash.random(0, 1)
        let valid = await this.checkUser()
        if (!valid) {
            this.reply('今日已经为你占卜过了，明天再来吧')
            return
        }
        await this.reply(
            `\n「${isUp ? '正位' : '逆位'}」${name}\n回应是：${isUp ? card.meaning.up : card.meaning.down
            }`,
            false,
            { at: true }
        )

        // 参考 https://github.com/MinatoAquaCrews/nonebot_plugin_tarot
        let path = './plugins/diy/data/tarot_resource'
        let pic = segment.image(`file://${path}/${card.type}/${card.pic}`)
        await this.reply(pic)
    }
}

// 观音灵签
export class GoddessofMercy extends plugin {
    constructor() {
        super({
            name: '观音灵签',
            dsc: '求一签',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '^观音灵签$',
                    fnc: 'GoddessofMercy'
                }
            ]
        })
    }

    async GoddessofMercy(e) {

        let data = await redis.get(`Yunzai:setlinshimsg:${e.user_id}_qiuqian`);
        if (data) {
            console.log(data)
            data = JSON.parse(data)
            if (cd) {
                if (data.num != 0) {
                    e.reply([segment.at(e.user_id), " 观音灵签有" + cd + "分钟CD"]);
                    return true;
                }
            }
        }

        // let url = `http://ovooa.com/API/Ser/api?name=${e.sender.card}『${lodash.random(0, 100)}』&type=json`;
        let url = `http://ovooa.com/API/chouq/api.php`;
        let response = await fetch(url);
        let res = await response.json();
        console.log(res);

        if (res.code != 1) {
            e.reply("出错了哦~");
            return true
        }

        let msg = [
            //@用户
            segment.at(e.user_id),
            "\n第", segment.text(res.data.format), "签：", segment.text(res.data.draw), "\n",
            segment.image(res.data.image),
            "【解日】：", segment.text(res.data.explain), "\n",
            "【仙机】：", segment.text(res.data.details), "\n",
            "【签语】：", segment.text(res.data.annotate), "\n",
            "【起源】：", segment.text(res.data.source),
        ];

        e.reply(msg);

        redis.set(`Yunzai:setlinshimsg:${e.user_id}_qiuqian`, `{"num":1,"booltime":${cd}}`, { //写入缓存值
            EX: parseInt(60 * cd)
        });
        return true; //返回true 阻挡消息不再往下
    }
}

// 二次元的我
export class nijigan extends plugin {
    constructor() {
        super({
            name: '二次元的我',
            dsc: '生成二次元形象',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '^二次元的我$',
                    fnc: 'nijigan'
                }
            ]
        })
    }

    async nijigan(e) {

        let data = await redis.get(`Yunzai:setlinshimsg:${e.user_id}_nijigan`);

        if (data) {
            // console.log(data)
            data = JSON.parse(data)
            if (cd) {
                if (data.num != 0) {
                    e.reply([segment.at(e.user_id), " 下一次查看二次元的你还有" + cd + "分钟CD"]);
                    return true;
                }
            }
        }

        // 先尝试从数据库获取记录======================================
        // 当前日期，格式化为 DD
        let date = moment(new Date()).format('DD')
        // 获取数据库中的记录
        let nijigandata = await JSON.parse(await redis.get(`Yunzai:setlinshimsg:nijigandata_${e.user_id}`));
        // console.log("redis获取到的data:",nijigandata)
        // 如果获取到记录，且记录中的日期等于当前日期，则直接发送记录中的数据
        if (nijigandata && nijigandata.date == date) {
            e.reply(nijigandata.dsc)
        }
        // 如果没有记录或者记录中的日期不是今天的日期，则调用接口获取并存入记录
        else {
            let url = `http://ovooa.com/API/Ser/api?name=${e.sender.card}『${lodash.random(0, 100)}』&type=json`;
            let response = await fetch(url);
            let res = await response.json();

            if (res.code == -1) {
                e.reply("参数错误！");
                return true
            }

            res.text = res.text.replace(/『(.+?)』/g, "");

            let url2 = `http://ovooa.com/API/name/api.php?msg=${e.sender.card}『${lodash.random(0, 100)}』&type=json`;
            let response2 = await fetch(url2);
            let res2 = await response2.json();

            res2.text = res2.text.replace(/『(.+?)』/g, "")
            res2.text = res2.text.replace("泡在福尔马林里面的内脏", "沾着晨露的小黄花").trim();
            res2.text = res2.text.replace(/“|”/g, "").trim();

            if (res2.code == -1) {
                e.reply("参数错误！");
                return true
            }

            let msg = [
                segment.at(e.user_id), '\n',    // @用户
                segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${e.user_id}`),    //头像
                segment.text(res.text), '\n',  //用户的二次元属性
                segment.text(res2.text) // 成分
            ];

            e.reply(msg);
            // 将接口处获取到的记录存入redis数据库 
            let nijigandata = {
                date: moment(new Date()).format('DD'),
                dsc: msg
            }

            redis.set(`Yunzai:setlinshimsg:nijigandata_${e.user_id}`, JSON.stringify(nijigandata), { //写入缓存值
                EX: parseInt(2 * 24 * 60 * 60)
            });

        }
        redis.set(`Yunzai:setlinshimsg:${e.user_id}_nijigan`, `{"num":1,"booltime":${cd}}`, { //写入缓存值
            EX: parseInt(60 * cd)
        });
        return true; //返回true 阻挡消息不再往下
    }
}

// 今天吃什么
export class what2eat extends plugin {
    constructor() {
        super({
            name: 'what2eat',
            dsc: '今天吃什么',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '^#?咱?(今天|明天|[早中午晚][上饭餐午]|早上|夜宵|今晚)吃(什么|啥|点啥)',
                    fnc: 'what2eat'
                },
                {
                    reg: '^#?添加食物',
                    fnc: 'addFood'
                },
                {
                    reg: '^#?删除食物',
                    fnc: 'deleteFood'
                }
            ]
        })
    }

    getKey() {
        return `Yz:what2eat:foods:${this.e.group_id}`
    }

    async addFood() {
        if (!this.e.isGroup) {
            return await this.reply('请群聊发送')
        }
        const key = this.getKey()
        const foods = this.e.msg.split(' ').filter(Boolean).slice(1)
        foods.forEach(async (food) => {
            await redis.sAdd(key, food)
        })
        await this.reply(`添加了${foods.length}个群特色食物...`)
    }

    async deleteFood() {
        if (!this.e.isGroup) {
            return await this.reply('请群聊发送')
        }
        const key = this.getKey()
        const foods = this.e.msg.split(' ').filter(Boolean).slice(1)
        foods.forEach(async (food) => {
            await redis.sRem(key, food)
        })
        await this.reply(`已经尝试删除${foods.length}个群特色食物...`)
    }

    async what2eat() {
        let food = Foods
        if (this.e.isGroup) {
            const key = this.getKey()
            const groupFood = await redis.sMembers(key)
            food = this.e.msg.split(' ')[0]?.includes('咱')
                ? groupFood
                : [...Foods, ...groupFood]
        }

        if (!food || food.length == 0) return

        const result = lodash.sampleSize(food, 4).join('|')
        await this.reply(`🌟推荐尝试：${result}`, false, { at: true })
    }
}

// 骰子
export class dice extends plugin {
    constructor() {
        super({
            name: 'roll',
            dsc: 'roll骰子',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '^#?roll ',
                    fnc: 'roll'
                },
                {
                    reg: '^#?r ',
                    fnc: 'r'
                }
            ]
        })
    }

    async roll() {
        const choices = this.e.msg.split(' ').slice(1)
        const result = lodash.sample(choices)
        await this.reply(`为你选择：${result}`, false, { at: true })
    }

    async r() {
        const range = this.e.msg.split(' ').map(Number).filter(Number.isInteger)
        const end = range.pop() ?? 100
        const start = range.pop() ?? 1
        const result = lodash.random(start, end)
        await this.reply(`在 ${start} 和 ${end} 间roll到了：${result}`)
    }
}

// latex
export class tex extends plugin {
    constructor() {
        super({
            name: 'tex 公式转换',
            dsc: '利用 katex 渲染 tex 公式',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '^#?tex\\s',
                    fnc: 'render'
                }
            ]
        })
    }

    async render() {
        const formula = this.e.msg.split(/(?<=^\S+)\s/).pop()
        const texHtml = katex.renderToString(formula, {
            throwOnError: false,
            strict: false
        })
        let data = {
            texHtml,
            tplFile: `${__dirname}/tex.html`
        }
        let img = await screenshot(puppeteer, 'tex', data)
        await this.reply(img)
    }
}

// 识图
export class pixivsoutu extends plugin {
    soutuUser = {}
    constructor() {
        super({
            name: '识图',  // 功能名称
            dsc: 'saucenao 识图',  // 功能描述
            event: 'message',
            priority: 10,
            rule: [
                {
                    reg: "^#*识图$",
                    fnc: 'searchPic'
                },
            ]

        })
        this.soutuUser = {}
    }

    //searchPic为分离发送图片和计时的代码块
    async searchPic(e) {

        if (e.hasReply) {
            let reply = (await e.group.getChatHistory(e.source.seq, 1)).pop()?.message;
            if (reply) {
                for (let val of reply) {
                    if (val.type == "image") {
                        e.img = [val.url];
                        break;
                    }
                }
            }
        }

        if (!e.img) {
            // if (this.soutuUser[e.user_id]) {
            //   clearTimeout(this.soutuUser[e.user_id]);
            // }
            // this.soutuUser[e.user_id] = setTimeout(() => {
            //   if (this.soutuUser[e.user_id]) {
            //     delete this.soutuUser[e.user_id];
            //     e.reply([segment.at(e.user_id), " 搜图已取消"]);
            //   }
            // }, 50000);
            e.reply([segment.at(e.user_id), " 用法：识图 + 图片"]);
            return false;
        }

        this.soutuUser[e.user_id] = true;
        return this.soutu(e);
    }

    async soutu(e) {
        try {
            if (!this.soutuUser[e.user_id]) return;

            if (!e.img) {
                this.cancel(e);
                return true;
            }
            let api_key = '03e3b0ab00ce023e627a02f7e8654866eda87574';//api_key只要填进这里

            //阻拦除主人外的私聊
            /*let panduan = null;
            if (e.isGroup) {
                panduan = e.group;
            } else if (e.isMaster) {
                panduan = e.friend;
            } else {
                let msg = [
                    "此功能不支持私聊嗷~"
                ]
                e.reply(msg);
                return false;
            }*/
            //api_key验证
            if (api_key == '') {
                let msg = [
                    "请自行去saucenao.com注册账号并获取api_key！"
                ]
                e.reply(msg);
                return false;
            }

            /*
            if (e.img == null) {
                let msg = [
                    segment.at(e.user_id), '\n',
                    "请在同一条消息内发送搜图和图片。"]
                e.reply(msg);
                return false;
            }*/

            let imgURL = e.img[0];
            let url;
            if (imgURL.length > 0) {
                url = "https://saucenao.com/search.php";
            }

            const response = await axios.get(url, {
                params: {
                    url: imgURL,
                    db: 999,
                    api_key: api_key,
                    output_type: 2,
                    numres: 3
                }
            })

            const res = response.data;
            const short_remaining = res.header.short_remaining;//30s内剩余搜图次数
            const long_remaining = res.header.long_remaining;//一天内剩余搜图次数

            let penable = false;
            let jp = false;
            let danb = false;
            let pother = false;
            let k = 0;

            //优先p站源，其次danbooru，再其次携带日文名，最后是其他
            if (res) {
                let i = 0;
                for (i; i < 3; i++) {
                    if (res.results[i].data.pixiv_id) { penable = true; k = i; break; }
                    else if (res.results[i].data.ext_urls) {
                        for (let j = 0; j < res.results[i].data.ext_urls.length; j++) {
                            if (res.results[i].data.ext_urls[j].indexOf('pixiv') != -1) {
                                pother = true; k = i; break;
                            }
                            if (pother) { break; }
                        }
                    }
                    else if (res.results[i].data.ext_urls) {
                        for (let j = 0; j < res.results[i].data.ext_urls.length; j++) {
                            if (res.results[i].data.ext_urls[j].indexOf('danbooru') != -1) {
                                danb = true; k = i; break;
                            }
                            if (danb) { break; }
                        }
                    }
                    else if (res.results[i].data.jp_name) { jp = true; k = i; break; }
                    else { penable = false; k = 0; }
                }
            }

            //过滤相似度<=70%的图片，并返回首张图片
            if (res.results[k].header.similarity <= 70) { k = 0; }

            let msg;

            if (penable) {
                //p中danbooru源
                let pdanb = false;
                if (res.results[k].data.ext_urls) {
                    for (let j = 0; j < res.results[k].data.ext_urls.length; j++) {
                        if (res.results[k].data.ext_urls[j].indexOf('danbooru') != -1)
                            pdanb = true; break;
                    }
                }
                if (pdanb) {
                    msg = [segment.at(e.user_id), '\n',
                    "相似度：" + res.results[k].header.similarity + "%\n",
                    "danbooru_id：" + (res.results[k].data.danbooru_id ? res.results[k].data.danbooru_id : ''), '\n',
                    "gelbooru_id：" + (res.results[k].data.gelbooru_id ? res.results[k].data.gelbooru_id : ''), '\n',
                    "creator：" + (res.results[k].data.creator ? res.results[k].data.creator : ''), '\n',
                    "material：" + (res.results[k].data.material ? res.results[k].data.material : ''), '\n',
                    "characters：" + (res.results[k].data.characters ? res.results[k].data.characters : ''), '\n',
                    "来源：" + (res.results[k].data.source ? res.results[k].data.source : ''), '\n',
                    "链接：" + res.results[k].data.ext_urls[0], '\n',
                    segment.image(res.results[k].header.thumbnail), '\n',
                        // "一天内还可搜索" + long_remaining + "次"
                    ]
                }
                //p站源
                else {
                    msg = [segment.at(e.user_id), '\n',
                    "相似度：" + res.results[k].header.similarity + "%\n",
                    "标题：" + (res.results[k].data.title ? res.results[k].data.title : ''), '\n',
                    "P站ID：" + (res.results[k].data.pixiv_id ? res.results[k].data.pixiv_id : ''), '\n',
                    "画师：" + (res.results[k].data.member_name ? res.results[k].data.member_name : ''), '\n',
                    "来源：" + res.results[k].data.ext_urls[0], '\n',
                    segment.image(res.results[k].header.thumbnail), '\n',
                        // "一天内还可搜索" + long_remaining + "次"
                    ];
                }
            }
            else if (danb) {
                msg = [segment.at(e.user_id), '\n',
                "相似度：" + res.results[k].header.similarity + "%\n",
                "danbooru_id：" + (res.results[k].data.danbooru_id ? res.results[k].data.danbooru_id : ''), '\n',
                "gelbooru_id：" + (res.results[k].data.gelbooru_id ? res.results[k].data.gelbooru_id : ''), '\n',
                "creator：" + (res.results[k].data.creator ? res.results[k].data.creator : ''), '\n',
                "material：" + (res.results[k].data.material ? res.results[k].data.material : ''), '\n',
                "characters：" + (res.results[k].data.characters ? res.results[k].data.characters : ''), '\n',
                "来源：" + (res.results[k].data.source ? res.results[k].data.source : ''), '\n',
                "链接：" + res.results[k].data.ext_urls[0], '\n',
                segment.image(res.results[k].header.thumbnail), '\n',
                    // "一天内还可搜索" + long_remaining + "次"
                ]
            }

            else if (pother) {
                msg = msg = [
                    segment.at(e.user_id), '\n',
                    "相似度：" + res.results[k].header.similarity + "%\n",
                    "标题：" + (res.results[k].data.title ? res.results[k].data.title : ''), '\n',
                    "service：" + (res.results[k].data.service ? res.results[k].data.service : ''), '\n',
                    "画师ID：" + (res.results[k].data.user_id ? res.results[k].data.user_id : ''), '\n',
                    "来源：" + res.results[k].data.ext_urls[0], '\n',
                    segment.image(res.results[k].header.thumbnail), '\n',
                    // "一天内还可搜索" + long_remaining + "次"
                ];
            }

            else if (jp) {
                msg = [
                    segment.at(e.user_id), '\n',
                    "相似度：" + res.results[k].header.similarity + "%\n",
                    "画师：" + (res.results[k].data.creator ? res.results[k].data.creator : ''), '\n',
                    "来源：" + (res.results[k].data.source ? res.results[k].data.source : ''), '\n',
                    "日文名：" + (res.results[k].data.jp_name ? res.results[k].data.jp_name : ''), '\n',
                    segment.image(res.results[k].header.thumbnail), '\n',
                    // "一天内还可搜索" + long_remaining + "次"
                ]
            }
            else {
                msg = [
                    segment.at(e.user_id), '\n',
                    "相似度：" + res.results[k].header.similarity + "%\n",
                    "画师：" + res.results[k].data.creator || res.results[k].data.author || res.results[k].data.author_name, '\n',
                    "来源：" + res.results[k].data.source || res.results[k].data.author_url, '\n',
                    segment.image(res.results[k].header.thumbnail), '\n',
                    // "一天内还可搜索" + long_remaining + "次"
                ]
            }

            e.reply(msg);
        } catch (err) {
            console.log(err);
            let msg = [
                "插件加载出错，\n",
                "请反馈给插件维护者哦"
            ]
            e.reply(msg);
        }
        this.cancel(e)
        return true;//返回true 阻挡消息不再往下
    }

    //取消搜图
    cancel(e) {
        if (this.soutuUser[e.user_id]) {
            clearTimeout(this.soutuUser[e.user_id]);
            delete this.soutuUser[e.user_id];
        }
    }
}

// 点歌
export class shareMusic extends plugin {
    constructor() {
        super({
            name: '点歌',
            dsc: '点歌系统',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: "^点歌(.*)$",
                    fnc: 'shareMusic'
                }
            ]
        })
    }

    async shareMusic(e) {
        let searchURL = "http://127.0.0.1:7894/search?keywords=paramsSearch"  // 网易云
        let msg = e.msg.replace(/(点歌 )|(点歌)/g, "");
        let flag = e.msg.indexOf("--singer");
        let singer;
        if (flag != -1) {
            singer = e.msg.slice(flag + "--singer".length + 1)
            msg = msg.slice(0, flag - 4)
            flag = 1
        }
        else {
            singer = null
            flag = 0
        }

        try {
            msg = encodeURI(msg);
            const params = { search: msg };
            let url = searchURL.replace("paramsSearch", msg);
            logger.info(url)
            let response = await fetch(url);
            const { data, result } = await response.json();
            let songList = result?.songs?.length ? result.songs : [];
            if (!songList[0]) {
                await e.reply(`没有找到该歌曲哦(仅支持网易云)`);
                return true;
            }

            let songIndex = 0;
            let tempReg = '(' + singer + ')';
            if (flag == 1) {
                for (; songIndex < result.songs.length; songIndex++) {
                    if (songList[songIndex].artists[0].name.match(tempReg) != null) {
                        break;
                    }
                }
                if (songIndex >= result.songs.length) {
                    await e.reply(`没有找到该指定歌手对应的歌曲哦(尝试正确拼写歌手名)`);
                    return true;
                }
            }

            if (e.isPrivate) {
                await e.friend.shareMusic("163", songList[songIndex].id);
            }
            else if (e.isGroup) {
                await e.group.shareMusic("163", songList[songIndex].id);
                /** 使用 ffmpeg 转换成语音
                let response = await fetch(`https://autumnfish.cn/song/url?id=${songList[0].id}`);
                const { data } = await response.json();
                if (!data[0].url) return true;
                await e.reply(segment.record(data[0].url));
                */
            }
        }
        catch (error) {
            console.log(error);
        }
        return true; //返回true 阻挡消息不再往下
    }
}