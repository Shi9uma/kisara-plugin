# 自用 Yunzai_bot 插件

> 根据各种插件魔改而来

## 目前功能

可以在 `apps` 文件夹中打开 `.js` 后缀文件查看批注。功能开关在 `config/index.config.yaml` 文件中，在初次加载插件后请**务必重启 bot**，会自行创建一个 `./config` 文件夹，并将 `index.config.yaml` 自动复制过去

## 安装方法

- 将插件整个放在 `./Yunzai-bot/plugins/` 下，默认插件名称为 `diy`，您可以在 `{插件名称}/default/config.index.yaml` 文件中修改插件的默认名，也请修改后对应修改文件名 `./Yunzai-bot/plugins/{插件名称}`
- 获取本插件的指令：`git clone https://github.com/Shi9uma/oicqdiy.git ./Yunzai-bot/plugins/{期望的插件名}`，请您自行修改后面的路径以保证插件能被正常加载
- 本插件还引入了 `shelljs，axios` 等依赖，您在启动插件后，会接收到相应缺少插件的依赖报错。此时您可以回到 `./Yunzai-bot` 的根目录下，使用 `npm install {缺失的依赖名称}`，这里我推荐您使用 [cnpm](https://zhuanlan.zhihu.com/p/120159632)(安装后可以直接将 npm 修改成 cnpm 即可，其他不变)，访问速度更快。

## todo

- utils
	- [ ] 添加权限检测函数，几种权限类型组合
	- [ ] 添加 redis 操纵 api 化，按照 `群号.qq.时间`，`friend.qq.time` 的键值来设计
- 插件热重载
- 简报
	- [ ] 简报定时推送
- Bot 系统优化
	- [ ] 一键开关，参考千羽插件
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

## PROBLEM

**可能遇到的问题**

1. `默认配置文件夹 ${dirName} 不存在, 为保证插件正常运行, 请通过 github 获取默认配置文件`。遇到这个问题只需要从本 github 仓库获取默认配置文件夹 `default` 即可(需要包含所有 yaml 文件)，也可以通过修改本插件的 `index.js` 逻辑来启用插件，但不能保证之后所有插件能正常使用。

## 文件配置逻辑

`schedule.todayNews.yaml`：这是一个 todayNews 功能的配置文件，`schedule` 称为 app，`todayNews` 称为 func
