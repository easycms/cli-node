const env = process.env
const fs = require('fs')
const path = require('path')
const mkdirsSync = require('./mkdirsSync.js')
module.exports = start

function start () {
  // 基础环境变量
  return baseInit()
  // config 根目录 配置环境变量
    .then(() => configRootPathInit())
    .then(() => Promise.all([
      daemonRpcPortInit(),
      daemonLogFileInit(),
      daemonEnterFileInit()
    ]))
}
module.exports.extend = extend
// 把常量压入静态变量

function baseInit () {
  extend({
  // 启动守护进程超时时间，单位：秒
    EASYCMS_DAEMON_LAUNCH_TIMEOUT: '60',
    // 调用超时超时时间，单位：秒
    EASYCMS_API_RPC_TIMEOUT: '60'
  })
  return Promise.resolve()
}
function configRootPathInit () {
  if (!env.EASYCMS_CONFIG_ROOT_PATH) {
    if (process.platform === 'win32' || process.platform === 'win64') {
      env.EASYCMS_CONFIG_ROOT_PATH = 'c:\\easycms\\'
    } else {
      env.EASYCMS_CONFIG_ROOT_PATH = '/etc/easycms/config'
    }
    if (!fs.existsSync(env.EASYCMS_CONFIG_ROOT_PATH)) {
      mkdirsSync(env.EASYCMS_CONFIG_ROOT_PATH, {
        recursive: true,
        mode: 0o666
      })
      // 强制重写权限为666
      fs.chmodSync(env.EASYCMS_CONFIG_ROOT_PATH, 0o777)
    }
  }
  return Promise.resolve()
}

function daemonRpcPortInit () {
  if (!env.EASYCMS_DAEMON_RPC_PORT) {
  // Windows专用
    if (process.platform === 'win32' || process.platform === 'win64') {
      env.EASYCMS_DAEMON_RPC_PORT = '\\\\.\\pipe\\daemon.rpc.easycms.sock'
    } else {
      env.EASYCMS_DAEMON_RPC_PORT = path.join(env.EASYCMS_CONFIG_ROOT_PATH, 'daemon.rpc.easycms.sock')
    }
  }
  return Promise.resolve()
}

function daemonEnterFileInit () {
  if (!process.env.EASYCMS_DAEMON_ENTER_FILE) {
    return Promise.resolve()
      .then(() => {
        try {
          return require.resolve('@easyke/daemon')
        } catch (e) {
          return Promise.reject(e)
        }
      })
      .then(path => {
        process.env.EASYCMS_DAEMON_ENTER_FILE = path
      }, e => Promise.resolve())
  }
  return Promise.resolve()
}

function daemonLogFileInit () {
  if (!env.EASYCMS_DAEMON_OUT_LOG_FILE_PATH) {
    env.EASYCMS_DAEMON_OUT_LOG_FILE_PATH = '/etc/easycms/config/log.log'
  }
  if (!env.EASYCMS_DAEMON_ERR_LOG_FILE_PATH) {
    env.EASYCMS_DAEMON_ERR_LOG_FILE_PATH = '/etc/easycms/config/err.log'
  }
  return Promise.resolve()
}

function extend (envs) {
  Object.keys(envs).filter(key => !env[key] && env[key]).forEach(key => {
    env[key] = envs[key]
  })
}
