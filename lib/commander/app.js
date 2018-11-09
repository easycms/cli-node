'use strict'
module.exports = launchCli
// 打印日志
const logger = require('../logger.js')
// 命令行处理工具
const commander = require('commander')
// 调试
const debug = require('debug')('easycms:cli')

commander.usage('easycms app [options] <file ...>')
/**
 * 控制台
 */
commander.command('start [name|id...]')
  .description('console an app')
  .action(function (cmd, opts) {
    logger.start('app start...')
  })

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