# 自用 Yunzai Bot 插件

> 根据各种插件而自用魔改，如果您有其他建议欢迎提交 issue
>
> **本插件仅限内部交流与小范围使用，可随意学习、参考以及移植，请勿将本插件用于以盈利为目的的场景。**
>
> **本插件的图片与其他素材均来自于网络，仅供交流学习使用，如有侵权请联系，会立即删除**

- [本家](https://github.com/Le-niao/Yunzai-Bot)，目前处于禁用状态
- [Github 上其他 fork 版本](https://github.com/Yummy-cookie/Yunzai-Bot.git)
- [Gitee 目前还在维护的版本(推荐)](https://gitee.com/yoimiya-kokomi/Yunzai-Bot.git)

## 目前功能

可以在 `apps` 文件夹中打开 `.js` 后缀文件查看批注。功能开关在 `config/index.config.yaml` 文件中，会自行创建一个 `./config` 文件夹，并将 `index.config.yaml` 自动复制过去

## 安装方法

- 将插件整个放在 `./Yunzai-bot/plugins/` 下，默认插件名称为 `diy`，您可以随意修改该插件的名称，暂时没测试过中文路径能否正常运行，请尽可能使用英文路径
- 获取本插件的指令：`git clone https://github.com/Shi9uma/oicqdiy.git ./Yunzai-bot/plugins/{期望的插件名}`，请您自行修改后面的路径以保证插件能被正常加载
- 本插件还引入了 `shelljs，axios` 等依赖，您在启动插件后，会接收到相应缺少插件的依赖报错。此时您可以回到 `./Yunzai-bot` 的根目录下，使用 `npm install {缺失的依赖名称}`，这里我推荐您使用 [cnpm](https://zhuanlan.zhihu.com/p/120159632)（安装后可以直接将 npm 修改成 cnpm 即可，其他不变），访问速度更快。

## todos

- 机器人词库
    - [ ] 相似度拟合发送
    - [ ] 延时发送
    - [ ] 按时间复读
    - [ ] 闭嘴，在某个群说了闭嘴则写入文件

- utils
  - [x] init 函数
  - [ ] 添加权限检测函数，几种权限类型组合
  - [ ] 添加 redis 操纵 api 化，按照 `群号.qq.时间`，`friend.qq.time` 的键值来设计
- ~~塔罗牌更新，逻辑修改~~
- 简报
  - [ ] 简报定时推送
- Bot 系统优化
  - [x] 插件热重载，需要搭配我配套 fork 出来的 yunzai bot 使用
  - [ ] 一键开关
  - [ ] 主人全局带话，回复某一信息以多群转发
  - [ ] 延时回复功能 doreply
  - [ ] 主人邀请后，会自动添加到群可用列表
- 识图、搜番、本子等
  - [ ] 手动指定相似性阈值
  - [ ] [番剧识别功能](https://github.com/yeyang52/yenai-plugin/blob/master/apps/picSearch.js)
  - [ ] 延时接收图片功能
  - [ ] 搜本子
- [计算抽卡期望](https://github.com/MSIsunny/GenshinWishCalculator-py/blob/main/WishSupport.py)
- [B 站订阅功能，开播、动态推送，按群区分](https://github.com/HeadmasterTan/zhi-plugin.git)
- [原神角色参考面板插件](https://github.com/howe0116/howe-plugin)，[nga 资源](https://bbs.nga.cn/read.php?tid=25843014&rand=967)
- 机器人记事本功能

## 可能遇到的问题

>   默认配置文件夹 ${dirName} 不存在, 为保证插件正常运行, 请通过 github 获取默认配置文件。
>

遇到这个问题只需要从本 github 仓库获取默认配置文件夹 `default` 即可(需要包含所有 yaml 文件)，也可以通过修改本插件的 `index.js` 逻辑来启用插件，但不能保证之后所有插件能正常使用。

>   关于与 `插件目录/data/apitoken.json` 文件相关错误的情况。

需要自行申请 apikey，请按照相关提示修改该文件相关 key，对应的您也可以自行增改 api 文件

## 札记

- 插件的命名逻辑：`schedule.todayNews.yaml`：这是一个 todayNews 功能的配置文件，`schedule` 称为 app，`todayNews` 称为 func
- 阅读了 Yunzai 的源码，发现使用 `index.js` 作为插件入口的方式下，不会自动监听，现在尝试直接热重载单个 app 的方式，还在探索中

## 致谢

1.   本家机器人框架，Yunzai-Bot，[Le-niao/Yunzai-Bot](https://github.com/Le-niao/Yunzai-Bot.git)
2.   塔罗牌占卜功能，[MinatoAquaCrews/nonebot_plugin_tarot](https://github.com/MinatoAquaCrews/nonebot_plugin_tarot.git)
3.   机器人词库，[Neko002](https://mirai.mamoe.net/topic/1829/强大的二次元聊天机器人词库2w-词条-不定期更新)
4.   喵喵插件，[yoimiya-kokomi/miao-plugin](https://github.com/yoimiya-kokomi/miao-plugin.git)
5.   白纸插件，[HeadmasterTan/zhi-plugin](https://github.com/HeadmasterTan/zhi-plugin.git)
6.   椰奶插件，[yeyang52/yenai-plugin](https://github.com/yeyang52/yenai-plugin.git)
7.   计算抽卡期望源码，[MSIsunny/GenshinWishCalculator-py](https://github.com/MSIsunny/GenshinWishCalculator-py.git)
8.   角色参考面板功能，[howe0116/howe-plugin](https://github.com/howe0116/howe-plugin.git)
9.   

