# 自用 Yunzai_bot 插件

> 根据各种插件魔改而来, 基本都会贴上源引用

## 目前功能

可以在 `apps` 文件夹中打开 `.js` 后缀文件查看批注。功能开关在 `config/index.config.yaml` 文件中，在初次加载插件后请**务必重启 bot**，会自行创建一个 `./config` 文件夹，并将 `index.config.yaml` 自动复制过去

## 安装方法

- 将插件整个放在 `./Yunzai-bot/plugins/` 下，默认插件名称为 `diy`，您可以在 `./default/config.index.yaml` 文件中修改插件的默认名，也请修改后对应修改 `./Yunzai-bot/plugins/{要修改成的插件名称}`
- 获取本插件的指令：`git clone https://gitee.com/wkyuu/oicqdiy.git ./Yunzai-bot/plugins/{您期望的插件名}`，请您自行修改后面的路径以保证插件能被正常加载
- 本插件还引入了 `shelljs，axios` 等依赖，您在启动插件后，会接收到相应缺少插件的依赖报错。此时您可以回到 `./Yunzai-bot` 的根目录下，使用 `npm install {缺失的依赖名称}`，这里我推荐您使用 [cnpm](https://zhuanlan.zhihu.com/p/120159632)(即直接将 npm 修改成 cnpm 即可，其他不变)，访问速度更快。

## todo

1. 插件热重载方法，避免重连导致封号风险，[参考锅巴插件](https://github.com/guoba-yunzai/guoba-plugin.git)
2. 每日简报, [链接](https://github.com/MuXia-0326/YunzaiBotJsPluginMuXia/commit/99fc41ede4b353fd5634c22760427926ef0f1274#diff-86ffc4882c17c1c4700966b8e470a9d5c98f8cc6ae9d19227cb1502bb4406f77)，每日 8 点获取，将图片存储，全局发送
3. ~~撤回机器人消息,~~ [链接](https://github.com/MuXia-0326/YunzaiBotJsPluginMuXia/blob/master/muxia_recall_bot_msg.js)
4. 机器人一键开关，参考千羽插件（暂定）
5. 机器人全局消息
6. 番剧识别, 搜图延时模式, [链接](https://github.com/yeyang52/yenai-plugin/blob/master/apps/picSearch.js)
7. 计算抽卡期望, [链接](https://github.com/MSIsunny/GenshinWishCalculator-py/blob/main/WishSupport.py)
8. ~~随机图片~~, [链接](https://gitee.com/ying_Sailor_uniform/wallpaperjs/blob/master/wallpaper.js)
9. b 站 up 开播, 动态推送, [链接](https://github.com/HeadmasterTan/zhi-plugin.git)
10. 原神角色参考面板，[插件](https://github.com/howe0116/howe-plugin)，[nga 资源](https://bbs.nga.cn/read.php?tid=25843014&rand=967)

## PROBLEM

**可能遇到的问题**

1. `默认配置文件夹 ${dirName} 不存在, 为保证插件正常运行, 请通过 github 获取默认配置文件`。遇到这个问题只需要从本 github 仓库获取默认配置文件夹 `default` 即可(需要包含所有 yaml 文件)，也可以通过修改本插件的 `index.js` 逻辑来启用插件，但不能保证之后所有插件能正常使用。

## 文件配置逻辑

`schedule.todayNews.yaml`：这是一个 todayNews 功能的配置文件，`schedule` 称为 app，`todayNews` 称为 func
