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
  create,
  del,
  deletes: del
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

/**
 * 创建应用
 */
function create (args = []) {
  if (args.length === 0) {
    logger.warn('create application failed')
    return
  }

  commander.api.connect()
    .then(() => {
      handeData(args).forEach(item => {
        commander.api.app.create(item)
          .then(app => {
            logger.success('app created successed')
          })
      })
    })
}

/**
 * 开启应用
 * @param {Array} args
 */
function start (appid) {}

/**
 * 停止应用
 * @param {Array} args
 */
function stop (appid) {}

/**
 * 删除应用
 * @param {Array} args
 */
function del (appids) {
  if (appids.length === 0) {
    logger.warn('appid is not fond')
    return
  }
  if (appids.indexof('all') > -1) {
    appids = ['all']
  }
  commander.api.connect()
    .then(() => {
      appids.forEach(appid => {
        commander.api.app.del(appid)
          .then(() => {
            logger.success('app created successed')
          })
      })
    })
}

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
