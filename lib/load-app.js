module.exports = loadApp
const fs = require('fs')
const {
  spawnSync
} = require('child_process')
const path = require('path')
const logger = require('./logger.js')

/**
 * 拉取项目
 * @param {String} gitUrl git地址
 */
async function loadApp (gitUrl) {
  if (gitUrl) {
    const folderName = getFolderName(gitUrl)
    const appPath = path.resolve(process.env.EASYCMS_TEMP_PATH, folderName)

    if (fs.existsSync(appPath)) {
      logger.info(`'${folderName}' is exist`)
      return appPath
    } else {
      return spawn('git', ['clone', gitUrl, folderName], {
        cwd: process.env.EASYCMS_TEMP_PATH,
        stdio: 'inherit',
        shell: process.platform === 'win32'
      })
        .then(_ => {
          logger.info(`'${folderName}' is clone successed`)
          return appPath
        })
    }
  } else {
    throw Error('git url in not did find')
  }
}

/**
 * 获取默认项目名
 * @param {String} path 地址
 */
function getFolderName (path) {
  if (typeof path === 'string') {
    var strList = path.split('.git')[0].split('/')
    return strList[strList.length - 1]
  }
  return ''
}

/**
 * 执行命令
 * @param {String} cmd 运行的命令
 * @param {Arrat} args 字符串参数列表
 * @param {Object} opts 执行参数
 */
function spawn (cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    var ls = spawnSync(cmd, args, opts)

    if (ls.error) {
      reject(ls.error)
    } else {
      resolve()
    }
  })
}
