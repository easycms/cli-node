#!/usr/bin/env node
'use strict'
// 配置包
const pkg = require('./pkg.js')
// 版本处理工具
const semver = require('semver')
// 打印日志
const logger = require('./logger.js')
// 命令行处理工具
const commander = require('commander')
// 引入一个API类
const API = require('@easyke/daemon-api')
// 引入静态变量
const constantsInit = require('./constants.js')
// 调试
const debug = require('debug')('easycms:cli')
// 设置当前显示内容为运行中
logger.start('runing...')
// 直接输出版本号
/**
这一个判断必须在最前面，避免后期设置导致有输出
[尽早发现沉默，避免印刷斑点](Early detection of silent to avoid printing motd)
*/
if (process.argv.indexOf('--silent') > -1 ||
    process.argv.indexOf('-s') > -1) {
  process.env.SILENT = 'true'
  process.env.EASYCMS_DISCRETE_MODE = 'true'
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
// 判断版本输出版本
commander.version(pkg.version)
  .option('--no-daemon', 'no child process launch daemon', false)
  .option('-v --version', 'print easycms version')
  .option('-s --silent', 'hide all messages', false)
// 帮助
commander.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ custom-help --help')
  console.log('  $ custom-help -h')
})

constantsInit()
  .then(() => getApiInstance())
  .then(api => {
    commander.api = api
    const method = process.argv.filter(str => str.indexOf('-') !== 0)[2]
    if (method === 'app') {
      return require('./commander/app.js')()
    } else if (method === 'console') {
      return require('./commander/console.js')()
    }
    return require('./commander/base.js')()
  })
  .then(() => {
    commander.api.disconnect()
    commander.api = void 0
    logger.stop()
  }, e => {
    commander.api.disconnect()
    commander.api = void 0
    logger.fatal(e)
  })

function getApiInstance (argument) {
// 实例化一个api调试
  debug('Create an API instance')
  // 实例化一个api调试
  const api = new API()

  return Promise.resolve(api)
}
Object.assign(commander, {
  resolve,
  reject,
  patchArg
})
function resolve () {
  if (commander.resolveAndReject && typeof commander.resolveAndReject[0] === 'function') {
    commander.resolveAndReject[0].apply(commander, arguments)
  }
  commander.resolveAndReject = void 0
}
function reject () {
  if (commander.resolveAndReject && typeof commander.resolveAndReject[1] === 'function') {
    commander.resolveAndReject[1].apply(commander, arguments)
  }
  commander.resolveAndReject = void 0
}
function patchArg (cmd) {
  var argsIndex
  if ((argsIndex = commander.rawArgs.indexOf('--')) >= 0) {
    var optargs = commander.rawArgs.slice(argsIndex + 1)
    cmd = cmd.slice(0, cmd.indexOf(optargs[0]))
  }
  return cmd
}
