'use strict'
module.exports = launchCli
// 打印日志
const logger = require('../logger.js')
// 命令行处理工具
const commander = require('commander')
// 调试
const debug = require('debug')('easycms:cli')

commander.usage('easycms console [options] <file ...>')
/**
 * 控制台
 */
commander.command('console [name|id...]')
  .description('console an app')
  .action(function (cmd, opts) {
    logger.start('connecting...')
    commander.api.connect()
      .then(() => {
        logger.success('connected')
        process.stdin.on('data', data => {
          console.log('msg-++:' + data)
        })
      })
      .then(commander.resolve, commander.reject)
  })

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
