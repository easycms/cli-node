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
// 下载git文件
const loadApp = require('../load-app.js')
const getConfig = require('../get-config.js')
// git地址正则
const isGitUrlReg = /^((http:\/\/)|(https:\/\/)|(git@))?([-A-Za-z0-9+&@#:/%=~_]([-A-Za-z0-9+&@#:/%=~_]{0,61}[a-zA-Z0-9])?\.)+[git]/
// 指令执行方法
const cmdHandler = Object.assign({
  start,
  stop,
  add: start
})

commander.usage('easycms app [options] <file ...>')
/**
 * 控制台
 */
commander.command('app [path|git...]')
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
 * 开启应用
 * @param {Array} args
 */
function start(args = []) {
  let proms = []
  handeData(args).forEach(item => {
    if (!item.exists) {
      logger.warn(`'${item.path}' does not exist`)
    } else {
      proms.push(
        new Promise((resolve, reject) => {
          if (item.isGit) {
            loadApp(item.path)
              .then(appPath => resolve(appPath))
              .catch(e => reject(e))
          } else {
            resolve(item.path)
          }
        })
        .then(appPath => {
          let config = getConfig(appPath)
          config.cwd = process.cwd()
          return config
        })
      )
    }
  })

  Promise.all(proms)
    .then(configs => {
      configs.forEach(config => {
        (c => {
          commander.api.connect()
            .then(() => {
              commander.api.app.start(c)
              c = void 0
            })
        })(config)
      })
    })
}

/**
 * 停止应用
 * @param {Array} args
 */
function stop(args) {}

/**
 * 数据处理
 * @param {Array} args
 */
function handeData(args) {
  return args.map(path => {
    let obj = {
      isGit: isGitUrlReg.test(path),
      exists: true
    }

    if (obj.isGit) {
      obj.path = path
    } else {
      obj.path = localPath.getTemplatePath(path)
      obj.exists = fs.existsSync(obj.path)
    }
    return obj
  })
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