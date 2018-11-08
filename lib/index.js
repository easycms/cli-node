#!/usr/bin/env node
'use strict'
// 打印日志
const logger = require('./logger.js')
// 引入静态变量
const constantsInit = require('./constants.js')

constantsInit()
  .then(() => require('./commander')())
  .then(() => logger.stop(), e => logger.fatal(e))
