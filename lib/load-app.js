module.exports = loadApp
const fs = require('fs')
const {
  spawn
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
      return shell('git', ['clone', gitUrl, folderName], {
        cwd: process.env.EASYCMS_TEMP_PATH
      })
        .then(_ => appPath)
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

function shell (cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    var ls = spawn(cmd, args, opts)
    ls.stdout.on('data', data => {
      logger.log(`${data}`)
    })

    ls.stderr.on('data', data => {
      logger.warn(`${data}`)
    })

    ls.on('close', code => {
      if (code === 0 || code === '0') {
        ls = void 0
        resolve()
      }
    })
  })
}
