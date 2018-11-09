'use strict'
module.exports = launchCli
// 打印日志
const logger = require('../logger.js')
// 命令行处理工具
const commander = require('commander')
// 调试
const debug = require('debug')('easycms:cli')

/**
 * 开始命令
 */
commander.command('start [name|id...]')
  .description('start and daemonize an app')
  .action(function (cmd, opts) {
    const args = commander.patchArg(cmd)
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
commander.command('app start [name|id...]')
  .description('start and daemonize an app')
  .action(function (cmd, opts) {
    const args = commander.patchArg(cmd)
    console.log(666666, cmd)
  })
/**
 * 开始命令
 */
commander.command('stop [name|id...]')
  .description('stop and daemonize an app')
  .action(function (cmd, opts) {
    const args = commander.patchArg(cmd)
    debug('commander stop', args)
    if (args.length) {
      commander.api.connect().then(() => commander.api.app.start(args))
    } else {
      commander.api.server.stop()
        .then(() => logger.success('停止easycms服务成功'))
        .then(commander.resolve, commander.reject)
    }
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
