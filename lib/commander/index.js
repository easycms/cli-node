'use strict'
module.exports = launchCli
/**
这一个判断必须在最前面，避免后期设置导致有输出
[尽早发现沉默，避免印刷斑点](Early detection of silent to avoid printing motd)
*/
if (process.argv.indexOf('--silent') > -1 ||
    process.argv.indexOf('-s') > -1) {
  process.env.SILENT = 'true'
  process.env.EASYCMS_DISCRETE_MODE = 'true'
}
// 配置包
const pkg = require('../pkg.js')
// 版本处理工具
const semver = require('semver')
// 命令行处理工具
const commander = require('commander')
// 打印日志
const logger = require('../logger.js')
// 设置当前显示内容为运行中
logger.start('runing...')
// 直接输出版本号
if (process.argv.indexOf('--no-daemon') > -1) {
  process.env.EASYCMS_NO_DAEMON = 'true'
}
// 直接输出版本号
if (process.argv.indexOf('-v') > -1) {
  // 显示版本号
  logger.log(pkg.version)
  // 退出进程
  process.exit(0)
}
// 如果node的版本大于，引入v8-compile-cache
if (semver.satisfies(process.versions.node, '>= 6.0.0')) {
  require('v8-compile-cache')
}
// 设置一个环境变量
process.env.EASYCMS_USAGE = 'CLI'
// 引入一个API类
const API = require('@easyke/daemon-api')
// 调试
const debug = require('debug')('easycms:cli')
// 实例化一个api调试
debug('Create an API instance')
// 实例化一个api调试
const api = new API()
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
    if (args.length) {
      api.connect().then(() => api.app.start(args))
    } else {
      api.server.start()
        .then(commander.resolve, commander.reject)
        .then(() => logger.success('启动easycms服务成功'))
    }
  })
/**
 * 开始命令
 */
commander.command('stop [name|id...]')
  .description('stop and daemonize an app')
  .action(function (cmd, opts) {
    const args = patchCommanderArg(cmd)
    if (args.length) {
      api.connect().then(() => api.app.start(args))
    } else {
      api.server.stop()
        .then(commander.resolve, commander.reject)
        .then(() => logger.success('停止easycms服务成功'))
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

function launchCli () {
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

/**
 * @todo to remove at some point once it's fixed in official commander.js
 * https://github.com/tj/commander.js/issues/475
 *
 * Patch Commander.js Variadic feature
 */
function patchCommanderArg (cmd) {
  var argsIndex
  if ((argsIndex = commander.rawArgs.indexOf('--')) >= 0) {
    var optargs = commander.rawArgs.slice(argsIndex + 1)
    cmd = cmd.slice(0, cmd.indexOf(optargs[0]))
  }
  return cmd
}
