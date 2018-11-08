'use strict'
const fs = require('fs')
const path = require('path')
module.exports = mkdirsSync
// 递归创建目录 同步方法
function mkdirsSync (dirname, mode) {
  if (fs.existsSync(dirname)) {
    return true
  } else {
    if (mkdirsSync(path.dirname(dirname), mode)) {
      fs.mkdirSync(dirname, mode)
      return true
    }
  }
}
