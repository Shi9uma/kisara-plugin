import { createRequire } from 'module'
import plugin from '../../lib/plugins/plugin.js'
const require = createRequire(import.meta.url)
const shell = require('shelljs')

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
          reg: '^!list$',
          fnc: 'minecraft'
        }
      ]
    })
  }

  async insurgency(e) {

    const require = createRequire(import.meta.url)
    const shell = require('shelljs')

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

    const require = createRequire(import.meta.url)
    const shell = require('shelljs')

    logger.info('[用户命令]', e.msg);
    try {
      let cmd = 'python /home/minecraft/jio/rcon.py -b list';
      let msgRet = shell.exec(cmd).stdout;
      msgRet = msgRet.match("'(.*)\'")[1].replace("\\n", "");
      console.log(msgRet);


      let num = msgRet.match(/\d+/g);
      let player = msgRet.match(/:(.*)/g)[0].replace(": ", "");

      let msg = [
        `[Minecraft Fantasy]\n`,
        `当前在线人数：${num[0]}\n`,
        `服务器最大人数：${num[1]}\n`,
        `玩家名单：[${player}]`
      ];

      this.reply(msg);
    }
    catch (error) {
      return false
    }

  }

}
