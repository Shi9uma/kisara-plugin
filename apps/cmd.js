import shell from 'shelljs'
import plugin from '../../../lib/plugins/plugin.js'

export class cmd extends plugin {
  constructor() {
    super({
      name: 'cmd',
      dsc: 'shell',
      event: 'message',
      priority: 5001,
      rule: [
        {
          reg: '^!insurgency(.*)$',
          fnc: 'insurgency'
        },
        {
          reg: '^!mc(.*)$',
          fnc: 'minecraft'
        },
        {
          reg: '^!frp(.*)$',
          fnc: 'frp'
        }
      ]
    })
  }

  async insurgency(e) {

    logger.info('[用户命令]', e.msg)
    let msg
    let arg = e.msg.replace(/(!insurgency )|(!insurgency)/g, "")
    let cmdList = ['help', 'status', 'start', 'stop']
    let serverName = 'Insurgency Sandstorm Server'

    if (cmdList.includes(arg)) {
      let cmd = 'systemctl args insurgency.service'
      let isActive = (shell.exec(cmd.replace('args', 'is-active')).stdout == 'active\n')

      if (arg == 'help') {
        msg = [
          `【${serverName}】\n`,
          '[+] 指令格式：!insurgency args\n',
          '[-] ====== args ======\n',
          '[-] help：打印帮助列表\n',
          '[-] status：查看服务器状态\n',
          '[-] start：服务器开机\n',
          '[-] stop：服务器关机'
        ]
        this.reply(msg)
        return
      }

      if (arg == 'stop') {
        if (isActive) {
          // cmd = 'ps aux | grep "/home/minecraft/dragonAdventure/start.sh" | grep -v grep | awk \'{print $2}\'| xargs  kill -9'
          cmd = 'sudo systemctl stop insurgency.service'
          if (shell.exec(cmd).code == 0) {
            msg = [
              `【${serverName}】\n`,
              `[+] 服务器已接受 stop 指令, 正在备份并关闭 ${serverName}...`
            ]
          }
        }
        else {
          msg = [
            `【${serverName}】\n`,
            '[+] 服务器并未开启'
          ]
        }
        this.reply(msg)
        return
      }

      if (arg == 'start') {
        if (isActive) {
          msg = [
            `【${serverName}】\n`,
            '[+] 服务器已经接受过 start 指令, 正在 【启动/正常运行】 中, 无需重复操作'
          ]
        }
        else {
          cmd = 'sudo systemctl start insurgency.service'
          if (shell.exec(cmd).code == 0) {
            msg = [
              `【${serverName}】\n`,
              '[+] 已接受 start 指令\n',
              '[-] 服务器正在启动中\n',
              '[-] 需要花费 1-2 分钟, 请稍后\n',
            ]
          }
          else {
            msg = [
              `【${serverName}】\n`,
              '[+] start 指令接收, 但未能启动服务器, 请联系维护管理员'
            ]
          }
        }
        this.reply(msg)
        return
      }

      if (arg == 'status') {
        if (!isActive) {
          msg = [
            `【${serverName}】\n`,
            '[+] 服务器并未开启'
          ]
        }
        else {
          msg = [
            `【${serverName}】\n`,
            '[+] 服务器正常运行中'
          ]
        }
        this.reply(msg)
        return
      }
    }

    else {
      msg = [
        `【${serverName}】\n`,
        '[+] 指令格式：!insurgency args\n',
        '[-] ====== args ======\n',
        '[-] help：打印帮助列表\n',
        '[-] status：查看服务器状态\n',
        '[-] start：服务器开机\n',
        '[-] stop：服务器关机'
      ]
      this.reply(msg)
      return
    }
  }

  async minecraft(e) {

    logger.info('[用户命令]', e.msg)
    let msg
    let arg = e.msg.replace(/(!mc )|(!mc)/g, "")
    let cmdList = ['help', 'list', 'start', 'stop']
    let serverName = 'Minecraft Dragon Adventure Server'

    if (cmdList.includes(arg)) {
      let cmd = 'systemctl args dragonAdventure.service'
      let isActive = (shell.exec(cmd.replace('args', 'is-active')).stdout == 'active\n')

      if (arg == 'help') {
        msg = [
          `【${serverName}】\n`,
          '[+] 指令格式：!mc args\n',
          '[-] ====== args ======\n',
          '[-] help：打印帮助列表\n',
          '[-] list：列出服务器当前在线名单\n',
          '[-] start：服务器开机\n',
          '[-] stop：服务器关机'
        ]
        this.reply(msg)
        return
      }

      if (arg == 'stop') {
        if (isActive) {
          // cmd = 'ps aux | grep "/home/minecraft/dragonAdventure/start.sh" | grep -v grep | awk \'{print $2}\'| xargs  kill -9'
          cmd = 'sudo systemctl stop dragonAdventure.service'
          if (shell.exec(cmd).code == 0) {
            msg = [
              `【${serverName}】\n`,
              `[+] 服务器已接受 stop 指令, 正在备份并关闭 ${serverName}`
            ]
          }
        }
        else {
          msg = [
            `【${serverName}】\n`,
            '[+] 服务器并未开启'
          ]
        }
        this.reply(msg)
        return
      }

      if (arg == 'start') {
        if (isActive) {
          msg = [
            `【${serverName}】\n`,
            '[+] 服务器已经接受过 start 指令, 正在 【启动/正常运行】 中, 无需重复操作'
          ]
        }
        else {
          cmd = 'sudo systemctl start dragonAdventure.service'
          if (shell.exec(cmd).code == 0) {
            msg = [
              `【${serverName}】\n`,
              '[+] 已接受 start 指令\n',
              '[-] 服务器正在启动中\n',
              '[-] 需要花费 3-5 分钟, 请稍后\n',
              '[-] 后续可以通过 list 指令确定是否启动成功'
            ]
          }
          else {
            msg = [
              `【${serverName}】\n`,
              '[+] start 指令接收, 但未能启动服务器, 请联系主人'
            ]
          }
        }
        this.reply(msg)
        return
      }

      if (!isActive) {
        msg = [
          `【${serverName}】\n`,
          "[+] 服务器暂未启动, 请使用 start 指令启动"
        ]
        this.reply(msg)
        return
      }

      if (isActive) {
        try {
          let msg
          let cmd = 'python /home/minecraft/jio/rcon.py -b list'

          if (shell.exec(cmd).code == 0) {

            let msgRet = shell.exec(cmd).stdout;
            msgRet = msgRet.match("'(.*)\'")[1].replace("\\n", "");

            let num = msgRet.match(/\d+/g);
            let player = msgRet.match(/:(.*)/g)[0].replace(": ", "");

            msg = [
              `【${serverName}】\n`,
              `[+] 当前在线人数：${num[0]}\n`,
              `[-] 服务器最大人数：${num[1]}\n`,
              `[-] 玩家名单：[${player}]`
            ]
          }
          else {
            msg = [
              `【${serverName}】\n`,
              '[+] 服务器尚未完全启动, 请稍后重试'
            ]
          }
          e.reply(msg)
          return
        }
        catch (error) {
          return
        }
      }
    }

    else {
      msg = [
        '[+] 无效输入\n',
        '[-] 指令格式：!mc args\n',
        '[-] ====== args ======\n',
        '[-] help：打印帮助列表\n',
        '[-] list：列出服务器当前在线名单\n',
        '[-] start：服务器开机\n',
        '[-] stop：服务器关机'
      ]
      this.reply(msg)
      return
    }
  }

  // 以下为自定义功能
  async frp(e) {

    logger.info('[用户命令]', e.msg)

    if (!this.e.isMaster) {
      this.reply('无效指令\n');
      return
    }

    let msg
    let arg = e.msg.replace(/(!frp )|(!frp)/g, "")
    let cmdList = ['help', 'status', 'start', 'stop']
    let serverName = 'frp server'

    if (cmdList.includes(arg)) {
      let cmd = 'systemctl args frp.service'
      let isActive = (shell.exec(cmd.replace('args', 'is-active')).stdout == 'active\n')

      if (arg == 'help') {
        msg = [
          `【${serverName}】\n`,
          '[+] 指令格式：!frp args\n',
          '[-] ====== args ======\n',
          '[-] help：打印帮助列表\n',
          '[-] status：查看frp服务状态\n',
          '[-] start：frp服务启动\n',
          '[-] stop：frp服务关闭'
        ]
        this.reply(msg)
        return
      }

      if (arg == 'stop') {
        if (isActive) {
          cmd = 'sudo systemctl stop frp.service'
          if (shell.exec(cmd).code == 0) {
            msg = [
              `【${serverName}】\n`,
              `[+] 已接受 stop 指令, 正在备份并关闭 ${serverName}...`
            ]
          }
        }
        else {
          msg = [
            `【${serverName}】\n`,
            '[+] frp 并未开启'
          ]
        }
        this.reply(msg)
        return
      }

      if (arg == 'start') {
        if (isActive) {
          msg = [
            `【${serverName}】\n`,
            '[+] frp 已经接受过 start 指令, 正在 【启动/正常运行】 中, 无需重复操作'
          ]
        }
        else {
          cmd = 'sudo systemctl start frp.service'
          if (shell.exec(cmd).code == 0) {
            msg = [
              `【${serverName}】\n`,
              '[+] 已接受 start 指令\n',
              '[-] frp正在启动中\n',
            ]
          }
          else {
            msg = [
              `【${serverName}】\n`,
              '[+] start 指令接收, 但未能启动frp服务, 请联系维护管理员'
            ]
          }
        }
        this.reply(msg)
        return
      }

      if (arg == 'status') {
        if (!isActive) {
          msg = [
            `【${serverName}】\n`,
            '[+] frp 并未开启'
          ]
        }
        else {
          msg = [
            `【${serverName}】\n`,
            '[+] frp 服务正常运行中'
          ]
        }
        this.reply(msg)
        return
      }
    }

    else {
      msg = [
        `【${serverName}】\n`,
        '[+] 指令格式：!frp args\n',
        '[-] ====== args ======\n',
        '[-] help：打印帮助列表\n',
        '[-] status：查看服务器状态\n',
        '[-] start：frp 服务启动\n',
        '[-] stop：frp 服务关闭'
      ]
      this.reply(msg)
      return
    }

  }
}
