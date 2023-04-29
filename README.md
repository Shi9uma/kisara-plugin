# kisara-plugin

> 因为使用了木更作为 chat 对象的自称, 导致变得越来越喜欢木更了, 所以决定将插件名称更名为 **kisara-plugin**, **当然本插件还是不限定文件夹名称, 您可以继续 diy 插件的名字**
>
> 根据各种插件学习而魔改, 如果您有其他建议欢迎提交 issue, 能点个 star 就是最大的鼓励了
>
> **本插件仅限内部交流与小范围使用, 可随意学习、参考以及移植, 请勿将本插件用于以盈利为目的的场景**
>
> **本插件的图片与其他素材均来自于网络, 仅供交流学习使用, 如有侵权请联系, 会立即删除**

- 本插件依附于上游框架 Yunzai Bot, 您可以从下方获取到这个框架
    - [Gitee 目前还在维护的版本(推荐)](https://gitee.com/yoimiya-kokomi/Yunzai-Bot.git)
    - [Github 上其他 fork 版本](https://github.com/yoimiya-kokomi/Miao-Yunzai.git)
    - [Github 本家](https://github.com/Le-niao/Yunzai-Bot), 目前处于禁用状态


## 目前功能

可以在 `apps` 文件夹中打开 `.js` 后缀文件查看批注。

初次运行后会自行创建一个 `./config` 文件夹, 并将 `index.config.yaml` 自动复制过去。

功能开关在 `config/index.config.yaml` 文件中。

## 安装方法

-   将插件整个放在 `./Yunzai-bot/plugins/` 下, 默认插件名称为 `kisara`, 您可以随意修改该插件的名称, 暂时没测试过中文路径能否正常运行, 请尽可能使用英文路径。

-   本插件开发和应用环境都在 Linux 平台, 暂时没有测试过 Windows 平台。

-   获取本插件的指令：`git clone https://github.com/Shi9uma/kisara-plugin.git ./Yunzai-bot/plugins/{期望的插件名}`, 请您自行修改后面的路径以保证插件能被正常加载。

-   本插件还引入了 `shelljs, axios` 等依赖, 您在启动插件后, 会接收到相应缺少插件的依赖报错。此时您可以回到 `./Yunzai-bot` 的根目录下, 使用 `npm install {缺失的依赖名称}`, 这里我推荐您使用 [cnpm](https://zhuanlan.zhihu.com/p/120159632)（安装后可以直接将 npm 修改成 cnpm 即可, 其他不变）, 访问速度更快。

## todos

- [ ] 菜单 main.ahelp
  - [ ] 重写菜单输出逻辑, 不同的功能也有自定义的 ahelp 信息, 使用 `main.ahelp.yaml`
  - [ ] 其他功能的使用手册
- [ ] 机器人聊天
  - [x] 基本功能
  - [x] 按群设置特例信息
  - [x] 相似度拟合检索词库
  - [x] 添加一些屏蔽词
  - [x] 更好地回复含有机器人名字的内容, 提高沉浸感
  - [x] 屏蔽某些单独账号
  - [x] 如果是 @ 必回, 避免出现很多不回的情况
  - [ ] 人工干预词库, 临时保存, 审核
  - [ ] 指令关闭功能, 写入 redis
  - [ ] 使用 gpt 训练词库 **(长期项目)**
- [ ] utils
  - [x] init 初始化
  - [x] 添加 redis 操纵 api 化, 按照 `fncName.isGroup.群号.qq号`, `fucName.isPrivate.qq号.qq号` 的键值来设计, eg. `[tarot][refreshTarot].isGlobal.123456789`, `[tarot][refreshTarot].isGroup.987654321.123456789`
  - [x] yaml 文件读取全局默认设置和特例设置
  - [ ] 添加权限检测函数, 几种权限类型组合
- [x] 塔罗牌占卜
  - [x] 基本功能
  - [x] 按群区分触发几率
  - [ ] redis 存储占卜内容
  - [ ] 在 `tarot.tarot.yaml` 写入期望塔罗牌占卜间隔时间
  - [ ] 完整的塔罗牌占卜流程, 包括提问者提出问题、洗牌、抽牌和正逆位**(长期项目)**
- [x] 简报
  - [x] 简报定时推送
  - [ ] 简报换源, 易即今日
- [ ] Bot 系统优化
  - [x] 插件热重载, 需要搭配配套 fork 出来的 yunzai bot 使用, ~~**注意：使用原生官方的 bot 框架仍然可以适配本插件, 但没有热重载功能, 即修改了插件后需要重启 bot**~~, **新版本的原生 yunzai-bot 已经支持了插件内热重载**
  - [ ] bot 一键开关
  - [ ] 定时发送服务, 例如报时服务(舰C 词库)
  - [ ] 主人全局带话, 回复某一信息以多群转发
  - [ ] 延时回复功能 doreply
  - [ ] 主人邀请后, 会自动添加到群可用列表
- [ ] 识图、搜番、本子等
  - [x] 搜图
  - [ ] 手动指定相似性阈值
  - [ ] [番剧识别功能](https://github.com/yeyang52/yenai-plugin/blob/master/apps/picSearch.js)
  - [ ] 延时识图
  - [ ] ~~搜本子~~
- [ ] 随机壁纸
  - [x] 基本功能
  - [ ] 添加 pixiv 支持
- [x] roll 骰子
  - [x] 基本功能
  - [x] 指定 roll 的数量
  - [x] 指定上下限
  - [ ] 研究跑团的玩法, `.ra技能检定`, `r3d100 100 中 roll 3 个`
  - [ ] 完整的跑团玩法 **(长期项目)**
- [ ] [计算抽卡期望](https://github.com/MSIsunny/GenshinWishCalculator-py/blob/main/WishSupport.py)
- [ ] [B 站订阅功能, 开播、动态推送, 按群区分](https://github.com/HeadmasterTan/zhi-plugin.git)
- [ ] [原神角色参考面板插件](https://github.com/howe0116/howe-plugin), [nga 资源](https://bbs.nga.cn/read.php?tid=25843014&rand=967)
- [ ] 记事本功能

## 可能遇到的问题

>   关于与 `插件目录/data/apitoken.json` 文件相关错误的情况。

需要自行申请 apikey, 请按照相关提示修改该文件相关 key, 对应的您也可以自行增改 api 文件

`apitoken.json` 文件内容示例如下：
```json
{
    "saucenao": "需要到 https://saucenao.com/ 自行申请"
}
```

>   **点歌** 功能需要 docker 支持, 相关 `docker-compose.yml` 如下:

```yaml
version: "3"

services:

  NeteaseCloudMusicApi:
    container_name: NeteaseCloudMusicApi
    image: gnehs/neteasecloudmusicapi-docker
    ports:
      - 7894:3000
    restart: always

```

## 札记

-   插件的命名逻辑：`schedule.todayNews.yaml`：这是一个 `todayNews` 功能的配置文件, `schedule` 称为 app, `todayNews` 称为 func

-   关于启用 `chatgpt` 功能, 需要自备账号与 api, 相关链接如下
    - [准备好个人的 OpenAI API Key](https://platform.openai.com/account/api-keys)
    - [查看个人 api 使用量](https://platform.openai.com/account/usage)
    - 将个人的 `api key` 填入到 `./data/apitoken.json` 文件中, 注意格式


## 致谢

本插件创建之初是作为个人纯魔改自用, 在开发过程中不断参考了各位为这个社区做贡献的大佬们的仓库而深受启发, 感谢各位为开源社区做出贡献。

1.   本家机器人框架, Yunzai-Bot, [Le-niao/Yunzai-Bot](https://github.com/Le-niao/Yunzai-Bot.git)
2.   塔罗牌占卜功能, [MinatoAquaCrews/nonebot_plugin_tarot](https://github.com/MinatoAquaCrews/nonebot_plugin_tarot.git)
3.   机器人词库, [Neko002](https://mirai.mamoe.net/topic/1829/强大的二次元聊天机器人词库2w-词条-不定期更新)
4.   喵喵插件, [yoimiya-kokomi/miao-plugin](https://github.com/yoimiya-kokomi/miao-plugin.git)
5.   白纸插件, [HeadmasterTan/zhi-plugin](https://github.com/HeadmasterTan/zhi-plugin.git)
7.   计算抽卡期望源码, [MSIsunny/GenshinWishCalculator-py](https://github.com/MSIsunny/GenshinWishCalculator-py.git)
8.   角色参考面板功能, [howe0116/howe-plugin](https://github.com/howe0116/howe-plugin.git)
9.   网易云音乐解析工具, [Binaryify/NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi.git)

## 其他

预计会选择采用 [go-cqhttp](https://github.com/Mrs4s/go-cqhttp.git) 搭配 golang/python 实现由 kisara-plugin 到 kisara-bot 的转变