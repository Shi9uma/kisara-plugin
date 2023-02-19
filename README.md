# 自用 Yunzai_bot 插件

> 根据各种插件魔改而来, 基本都会贴上源引用

## todo

1. 每日简报, [链接](https://github.com/MuXia-0326/YunzaiBotJsPluginMuXia/commit/99fc41ede4b353fd5634c22760427926ef0f1274#diff-86ffc4882c17c1c4700966b8e470a9d5c98f8cc6ae9d19227cb1502bb4406f77)，每日 8 点获取，将图片存储，全局发送
2. ~~撤回机器人消息,~~ [链接](https://github.com/MuXia-0326/YunzaiBotJsPluginMuXia/blob/master/muxia_recall_bot_msg.js)
3. 机器人一键开关
4. 机器人全局消息
5. 番剧识别, 搜图延时模式, [链接](https://github.com/yeyang52/yenai-plugin/blob/master/apps/picSearch.js)
6. 计算抽卡期望, [链接](https://github.com/MSIsunny/GenshinWishCalculator-py/blob/main/WishSupport.py)
7. ~~随机图片~~, [链接](https://gitee.com/ying_Sailor_uniform/wallpaperjs/blob/master/wallpaper.js)
8. b 站 up 开播, 动态推送, [链接](https://github.com/HeadmasterTan/zhi-plugin.git)
9. 原神角色参考面板，[插件](https://github.com/howe0116/howe-plugin)，[nga 资源](https://bbs.nga.cn/read.php?tid=25843014&rand=967)

## PROBLEM

**可能遇到的问题**

1. `默认配置文件夹 ${dirName} 不存在, 为保证插件正常运行, 请通过 github 获取默认配置文件`。遇到这个问题只需要从本 github 仓库获取默认配置文件夹 `default` 即可(需要包含所有 yaml 文件)，也可以通过修改本插件的 `index.js` 逻辑来启用插件，但不能保证之后所有插件能正常使用。

## 文件配置逻辑

`schedule.todayNews.yaml`：这是一个 todayNews 功能的配置文件，`schedule` 称为 app，`todayNews` 称为 func

1. 检查是否存在 config 文件夹
	1. 若有，直接下一步
	2. 若没有，创建 config 文件夹

2. 检查是否存在 app.name.yaml 配置文件
	1. 若有，直接下一步
	2. 若没有，从 default 文件夹复制一份 app.name.yaml 到 config 文件夹

3. 从配置文件 ./config/app.func.yaml 获取信息
