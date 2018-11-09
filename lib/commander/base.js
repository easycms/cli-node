'use strict'
module.exports = launchCli
// 配置包
const pkg = require('../pkg.js')
// 打印日志
const logger = require('../logger.js')
// 命令行处理工具
const commander = require('commander')
// 调试
const debug = require('debug')('easycms:cli')
// 判断版本输出版本
commander.version(pkg.version)
  .option('--no-daemon', 'no child process launch daemon', false)
  .option('-v --version', 'print easycms version')
  .option('-s --silent', 'hide all messages', false)

/**
 * 开始命令
 */
commander.command('start [name|id...]')
  .description('start and daemonize an app')
  .action(function (cmd, opts) {
    const args = patchCommanderArg(cmd)
    debug('commander start', args)
    if (args.length) {
      commander.api.connect().then(() => commander.api.app.start(args))
    } else {
      commander.api.server.start()
        .then(() => logger.success('启动easycms服务成功'))
        .then(commander.resolve, commander.reject)
    }
  })
/**
 * 开始命令
 */
commander.command('stop [name|id...]')
  .description('stop and daemonize an app')
  .action(function (cmd, opts) {
    const args = patchCommanderArg(cmd)
    debug('commander stop', args)
    if (args.length) {
      commander.api.connect().then(() => commander.api.app.start(args))
    } else {
      commander.api.server.stop()
        .then(() => logger.success('停止easycms服务成功'))
        .then(commander.resolve, commander.reject)
    }
  })
/**
 * 控制台
 */
commander.command('console [name|id...]')
  .description('console an app')
  .action(function (cmd, opts) {
    process.stdin.on('data', data => {
      console.log(data + '', 'data')
    })
    console.log('data')
    var i = 0
    var fn = function () {
      setTimeout(() => {
        process.stdout.write('第' + ++i + '次')
        setTimeout(() => {
          process.stdout.clearLine()
          process.stdout.cursorTo(0)
          fn()
        }, 1000)
      }, 1000)
    }
    fn()
  })
//
// Display help if 0 arguments passed to pm2
//
// if (process.argv.length == 2) {
//  commander.parse(process.argv)
//  displayUsage()
//  // Check if it does not forget to close fds from RPC
//  process.exit(cst.ERROR_EXIT)
// }
commander.resolve = function () {
  if (commander.resolveAndReject && typeof commander.resolveAndReject[0] === 'function') {
    commander.resolveAndReject[0].apply(commander, arguments)
  }
  commander.resolveAndReject = void 0
}
commander.reject = function () {
  if (commander.resolveAndReject && typeof commander.resolveAndReject[1] === 'function') {
    commander.resolveAndReject[1].apply(commander, arguments)
  }
  commander.resolveAndReject = void 0
}

/**
 * @todo to remove at some point once it's fixed in official commander.js
 * https://github.com/tj/commander.js/issues/475
 *
 * Patch Commander.js Variadic feature
 */
function patchCommanderArg(cmd) {
  var argsIndex
  if ((argsIndex = commander.rawArgs.indexOf('--')) >= 0) {
    var optargs = commander.rawArgs.slice(argsIndex + 1)
    cmd = cmd.slice(0, cmd.indexOf(optargs[0]))
  }
  return cmd
}

function launchCli() {
  return new Promise((resolve, reject) => {
    try {
      commander.resolveAndReject = [resolve, reject]
      commander.reject = reject
      resolve = reject = void 0
      commander.parse(process.argv)
    } catch (e) {
      typeof commander.reject === 'function' && commander.reject(e)
    }
  })
}