'use strict'
module.exports = launchCli
// 打印日志
const logger = require('../logger.js')
// 命令行处理工具
const commander = require('commander')
// 调试
// const debug = require('debug')('easycms:cli')
const localPath = require('../../utils/local-path.js')
const fs = require('fs')
// git地址正则
const isGitUrlReg = /^((http:\/\/)|(https:\/\/)|(git@))?([-A-Za-z0-9+&@#:/%=~_]([-A-Za-z0-9+&@#:/%=~_]{0,61}[a-zA-Z0-9])?\.)+[git]/
// 指令执行方法
const cmdHandler = Object.assign({
  start,
  stop,
  create
})

commander.usage('easycms app [options] <file ...>')
/**
 * 控制台
 */
commander
  .command('app [cmd...]')
  .description('all application instructions')
  .action(function (cmd, opts) {
    let argsList = [...cmd]
    let hander = argsList.shift(0)

    if (typeof cmdHandler[hander] !== 'function') {
      logger.error(`instruction: '${hander}' does not exist`)
    } else {
      cmdHandler[hander](argsList)
    }
  })

function create (args = []) {
  handeData(args).forEach(item => {
    ((args) => {
      commander.api.connect().then(() => {
        commander.api.app.create(args)
          .then(() => {
            args = void 0
          })
      })
    })(item)
  })
}

/**
 * 开启应用
 * @param {Array} args
 */
function start (args = []) {}

/**
 * 停止应用
 * @param {Array} args
 */
function stop (args) {}

/**
 * 数据处理
 * @param {Array} args
 */
function handeData (args) {
  let lists = []

  args.forEach(path => {
    let obj = {
      cwd: process.cwd()
    }
    if (isGitUrlReg.test(path)) {
      obj.repo = path
      lists.push(obj)
    } else {
      let tempPath = localPath.getTemplatePath(path)

      if (fs.existsSync(tempPath)) {
        // 先不处理本地地址
        // obj.repo = tempPath
      } else {
        logger.warn(`'${path}' is not exist`)
      }
    }
  })
  return lists
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
