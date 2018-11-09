const fs = require('fs')
const path = require('path')
const npmWhich = require('../utils/npm-which.js')
// 设置环境变量的正则
const envSetterRegex = /(\w+)=('(.+)'|"(.+)"|(.+))/
// 判断是否为Windows
const isWin = process.platform === 'win32' || process.platform === 'win64'
// Unix
const envUseUnixRegex = /\$(\w+)/g // $my_var
// Win
const envUseWinRegex = /%(.*?)%/g // %my_var%
// envExtract
const envExtract = isWin ? envUseUnixRegex : envUseWinRegex
/**
 * 执行脚本地址
 * @param {string} script path
 */
function getConfig(script) {
  // 获取配置json path
  let confPath = getConfPath(script)

  if (!confPath) return {}
  else {
    // 配置信息
    let pkgCofig = require(confPath)
    let scripts = pkgCofig.scripts || {}
    // 定义线程文件
    let commandFile = script || 'index.js'
    // 参数
    let args = []
    // 命令行
    let command = ''
    // npm-which 运行脚本
    let options = {
      silent: true,
      cwd: script,
      env: Object.create(null)
    }
    Object.keys(process.env).forEach(key => {
      options.env[key] = process.env[key]
    })
    options.env.PWD = options.cwd

    if (scripts.ddvstart) command = scripts.ddvstart
    else if (scripts.start) command = scripts.start
    else if (scripts.run) command = scripts.run

    if (command) {
      // 建立Which
      let _npmWhich = npmWhich(options.cwd)
      let argv = commandParseStrToArray(command.trim())
      // 提取命令
      command = argv.shift()
      // 如果第一个参数是 cross-env 这种环境变量的库，就直接去除
      switch (path.basename(command || '')) {
        case 'cross-env':
          break
        default:
          // 否则补充回去
          argv.unshift(command)
          break
      }
      let tempRes = getCommandArgsAndEnvVars(argv, options.env)
      command = tempRes[0]
      args = tempRes[1]
      // 试图查找js文件路径 获取命令的文件名来判断
      switch (path.basename(command || '')) {
        case 'node':
        case 'node.exe':
          // 因为不能使用node的 fork 来运行node
          // 另外说明第一个参数就是 node.js文件了
          commandFile = args.shift()
          break
        default:
          // 获取命令行文件地址，建议使用同步模式，
          // 由npmWhich原理可以看出，同步模式减少意外
          commandFile = _npmWhich.sync(command, options) || commandFile
          break
      }
    }
    options.env.PWD = options.cwd

    return {
      name: getName(pkgCofig, script),
      script: commandFile,
      env: options.env,
      args
    }
  }
}

/**
 * 获取配置文件地址，没有返回空
 * @param {string} filePath path
 */
function getConfPath(filePath) {
  let files = ['package.json', 'config.json', 'conf.json']

  for (let fileName of files) {
    let jsonPath = path.join(filePath, fileName)
    if (fs.existsSync(jsonPath)) {
      return jsonPath
    }
  }
  return ''
}

/**
 * 从配置信息或者路径中获取name
 * @param {object} conf 配置信息
 * @param {string} path 路径
 */
function getName(conf, path = '') {
  if (conf.name) {
    return conf.name
  } else {
    let nameList = []
    path.split('/').forEach(n => {
      if (n !== '') {
        nameList.push(n)
      }
    })
    return nameList[nameList.length - 1]
  }
}

/**
 * 指令转数组
 * @param {string|array} str 数组直接返回
 */
function commandParseStrToArray(str) {
  if (Array.isArray(str)) {
    return str
  }
  // 如果可以转字符串就自动转字符串
  if (typeof str.toString === 'function') {
    str = str.toString()
  }
  if (typeof str !== 'string') {
    // 不是字符串就抛出错误抛出错误
    throw new Error('The command in Package.json is not a string or an array')
  }
  var result = []
  var inQuote = false
  var currentWord = ''

  str.split('').forEach((token, tokenIndex, pieces) => {
    if (tokenIndex > 0 && pieces[tokenIndex - 1] === '\\') {
      currentWord += token
      return
    }

    if (token === '"') {
      inQuote = !inQuote
      if (!inQuote && currentWord.length) {
        result.push(currentWord)
        currentWord = ''
      }
      return
    }

    if (token === ' ' && !inQuote) {
      if (currentWord.length) {
        result.push(currentWord)
        currentWord = ''
      }
      return
    }

    currentWord += token
  })

  if (currentWord.length) {
    result.push(currentWord)
  }

  return result
}

function getCommandArgsAndEnvVars(args, envVars) {
  // eslint-disable-line
  let command
  envVars = envVars || Object.assign({}, process.env)
  const commandArgs = args.map(commandConvert)
  while (commandArgs.length) {
    const shifted = commandArgs.shift()
    const match = envSetterRegex.exec(shifted)
    if (match) {
      envVars[match[1]] = match[3] || match[4] || match[5]
    } else {
      command = shifted
      break
    }
    if (process.env.APPDATA) {
      envVars.APPDATA = process.env.APPDATA
    }
  }
  return [command, commandArgs, envVars]
}

function commandConvert(command) {
  const match = envExtract.exec(command)
  if (match) {
    command = isWin ? `%${match[1]}%` : `$${match[1]}`
  }
  return command
}

module.exports = getConfig