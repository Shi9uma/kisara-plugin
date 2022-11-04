import { createRequire } from 'module'
import shell from 'shelljs'
import plugin from '../../lib/plugins/plugin.js'

export class example extends plugin {
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
        }
      ]
    })
  }

  async insurgency(e) {

    logger.info('[用户命令]', e.msg);
    let arg = e.msg.replace(/(!insurgency )|(!insurgency)/g, "");
    let cmdList = ['start', 'stop', 'status', 'restart', 'log', 'help'];
    try {
      if (cmdList.includes(arg)) {
        let cmd = 'systemctl args insurgency.service';
        let checkStart = shell.exec(cmd.replace('args', 'is-active')).stdout;
        switch (arg) {
          case 'start':
            if (checkStart.includes('active')) {
              this.reply('[Insurgency Sandstorm Server] 正在健康地运行中，不需要启动指令');
            }
            else if (checkStart.includes('failed')) {
              let startServ = cmd.replace('args', 'start');
              shell.exec(startServ);
              this.reply('[Insurgency Sandstorm Server] 正在启动中，可能会花费 2-3 分钟的时间');
            }
            break;
          case 'stop':
            if (checkStart.includes('active')) {
              let stopServ = cmd.replace('args', 'stop');
              shell.exec(stopServ);
              this.reply('这个功能暂时禁用\n正在关闭 [Insurgency Sandstorm Server]');
            }
            else if (checkStart.includes('failed')) {
              this.reply('[Insurgency Sandstorm Server] 尚未启动');
            }
            break;
          case 'restart':
            let restartServ = cmd.replace('args', 'restart');
            shell.exec(restartServ);
            this.reply('[Insurgency Sandstorm Server] 正在重启');
            break;
          case 'status':
            this.reply(`[Insurgency Sandstorm Server] status: ${checkStart}`);
            break;
          case 'log':
            let checkLog = cmd.replace('args', 'status');
            this.reply(`${shell.exec(checkLog).slice(717,)}`);
            break;
          default:
            break;
        }
      }
      else {
        let msg = [
          "检测到非法输入\n",
          "usage: !insurgency [option]\n",
          "====== options ======\n",
          "start:   开机\n",
          "restart: 顾名思义\n",
          "status:  查询服务器成分\n",
          "stop[禁用]:    关机\n",
          "log[禁用]:     查看近期的 log\n",
        ];
        this.reply(msg);
      }
    }
    catch (error) {
      return false
    }
  }

  async minecraft(e) {

    logger.info('[用户命令]', e.msg)
    let msg
    let arg = e.msg.replace(/(!mc )|(!mc)/g, "")
    let cmdList = ['help', 'list', 'start', 'stop']

    if (cmdList.includes(arg)) {
      let cmd = 'systemctl args fantasy.service'
      let isActive = shell.exec(cmd.replace('args', 'is-active')).stdout.includes('active')

      if (arg == 'help') {
        msg = [
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
          // cmd = 'ps aux | grep "/home/minecraft/fantasy/start.sh" | grep -v grep | awk \'{print $2}\'| xargs  kill -9'
          cmd = 'echo root | sudo -S systemctl stop fantasy.service'
          if (shell.exec(cmd).code == 0) {
            msg = [
              '[+] 服务器已接受 stop 指令, 正在备份并关闭 mc fantasy...'
            ]
          }
        }
        else {
          msg = [
            '[+] mc fantasy 服务器并未开启'
          ]
        }
        this.reply(msg)
        return
      }

      if (arg == 'start') {
        if (isActive) {
          msg = [
            '[+] 服务器已经接受过 start 指令, 正在 【启动/正常运行】 中, 无需重复操作'
          ]
        }
        else {
          cmd = 'echo root | sudo -S systemctl start fantasy.service'
          if (shell.exec(cmd).code == 0) {
            msg = [
              '[+] 已接受 start 指令\n',
              '[-] 服务器正在启动中\n',
              '[-] 需要花费 3-5 分钟, 请稍后\n',
              '[-] 后续可以通过 list 指令确定是否启动成功'
            ]
          }
          else {
            msg = [
              '[+] start 指令接收, 但未能启动服务器, 请联系主人'
            ]
          }
        }
        this.reply(msg)
        return
      }

      if (!isActive) {
        msg = [
          "[+] mc fantasy 暂未启动, 请先启动服务器"
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
              `[+] Minecraft Fantasy\n`,
              `[-] 当前在线人数：${num[0]}\n`,
              `[-] 服务器最大人数：${num[1]}\n`,
              `[-] 玩家名单：[${player}]`
            ]
          }
          else {
            msg = [
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
}
