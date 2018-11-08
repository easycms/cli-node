'use strict'

const format = require('util').format
const chalk = require('chalk')
const pkg = require('./pkg.js')
const version = pkg.version
const cliCursor = require('cli-cursor')
const cliSpinners = require('cli-spinners')
const stripAnsi = require('./strip-ansi.js')
const stringWidth = require('./string-width.js')
const TEXT = Symbol('text')
const Table = require('./table/index.js')

class Logger {
  constructor (options) {
    if (typeof options === 'string') {
      options = {
        text: options
      }
    }

    this.isSupported = process.platform !== 'win32' || process.env.CI || process.env.TERM === 'xterm-256color'
    this.options = Object.assign({
      /**
       * Prefix.
       */
      prefix: `[${pkg.name}@${version}]`,
      symbols: (
        this.isSupported ? {
          info: chalk.blue('ℹ'),
          success: chalk.green('✔'),
          warn: chalk.yellow('⚠'),
          error: chalk.red('✖'),
          other: chalk.gray('-')
        } : {
          info: chalk.blue('i'),
          success: chalk.green('√'),
          warn: chalk.yellow('‼'),
          error: chalk.red('×'),
          other: chalk.gray('-')
        }
      ),
      text: '',
      color: 'cyan',
      stdout: process.stdout,
      stderr: process.stderr
    }, options)

    const sp = this.options.spinner
    this.spinner = typeof sp === 'object' ? sp : (process.platform === 'win32' ? cliSpinners.line : (cliSpinners[sp] || cliSpinners.dots)) // eslint-disable-line no-nested-ternary

    if (this.spinner.frames === undefined) {
      throw new Error('Spinner must define `frames`')
    }

    this.hideCursor = this.options.hideCursor !== false
    this.interval = this.options.interval || this.spinner.interval || 100
    this.id = null
    this.frameIndex = 0
    this.isEnabled = typeof this.options.isEnabled === 'boolean' ? this.options.isEnabled : ((this.stderr && this.stderr.isTTY) && !process.env.CI)

    // Set *after* `this.stderr`
    this.text = this.options.text
    this.linesToClear = 0
  }

  /**
   * Log a `message` to the console.
   *
   * @param {String} message
   */
  log () {
    return this.stopAndPersist(chalk.cyan(this.prefix) + ' ' + this.symbols.other, format.apply(format, arguments))
  }

  /**
   * Log an warn `message` to the console and no exit.
   *
   * @param {String} message
   */
  warn () {
    return this.stopAndPersist(chalk.yellow(this.prefix) + ' ' + this.symbols.warn, format.apply(format, arguments))
  }

  /**
   * Log an info `message` to the console and no exit.
   *
   * @param {String} message
   */
  info () {
    return this.stopAndPersist(chalk.blue(this.prefix) + ' ' + this.symbols.info, format.apply(format, arguments))
  }

  /**
   * Log an error `message` to the console and no exit.
   *
   * @param {String} message
   */
  error (message) {
    return this.stopAndPersist(chalk.red(this.prefix) + ' ' + this.symbols.error, format.apply(format, arguments))
  }

  /**
   * Log a success `message` to the console and exit.
   *
   * @param {String} message
   */
  success () {
    return this.stopAndPersist(chalk.green(this.prefix) + ' ' + this.symbols.success, format.apply(format, arguments))
  }

  /**
   * Log an error `message` to the console and exit.
   *
   * @param {String} message
   */
  fatal (message) {
    this.error(message)

    if (process.env.NODE_ENV === 'testing') {
      throw new Error('exit')
    } else {
      /* istanbul ignore next */
      process.exit(1)
    }
  }

  clear () {
    if (!this.isEnabled || !this.stderr.isTTY) {
      return this
    }

    for (let i = 0; i < this.linesToClear; i++) {
      if (i > 0) {
        this.stderr.moveCursor(0, -1)
      }
      this.stderr.clearLine()
      this.stderr.cursorTo(0)
    }
    this.linesToClear = 0

    return this
  }

  start (text) {
    if (text) {
      this.text = text
    }

    if (!this.isEnabled) {
      this.stderr.write(`- ${this.text}\n`)
      return this
    }

    if (this.isSpinning) {
      return this
    }

    if (this.hideCursor) {
      cliCursor.hide(this.stderr)
    }

    this.render()
    this.id = setInterval(this.render.bind(this), this.interval)

    return this
  }

  stop () {
    if (!this.isEnabled) {
      return this
    }

    clearInterval(this.id)
    this.id = null
    this.frameIndex = 0
    this.clear()
    if (this.hideCursor) {
      cliCursor.show(this.stderr)
    }

    return this
  }
  render () {
    this.clear()
    this.stderr.write(this.frame())
    this.linesToClear = this.lineCount

    return this
  }
  frame () {
    const { frames } = this.spinner
    let frame = frames[this.frameIndex]

    if (this.color) {
      frame = chalk[this.color](frame)
    }

    this.frameIndex = ++this.frameIndex % frames.length

    return frame + ' ' + this.text
  }
  stopAndPersist (prefix, msg, stream) {
    stream = stream || this.stdout
    this.stop()
    stream.write(`${prefix || (chalk.cyan(this.prefix) + ' ' + this.symbols.other)} ${msg || this.text}\n`)

    return this
  }
  get text () {
    return this[TEXT]
  }

  set text (value) {
    this[TEXT] = value
    const columns = this.stderr.columns || 80
    this.lineCount = stripAnsi('--' + value).split('\n').reduce((count, line) => {
      return count + Math.max(1, Math.ceil(stringWidth(line) / columns))
    }, 0)
  }
  get color () {
    return this.options.color
  }
  set color (value) {
    this.options.color = value
  }
  get prefix () {
    return this.options.prefix
  }
  set prefix (value) {
    this.options.prefix = value
  }
  get symbols () {
    return this.options.symbols
  }
  set symbols (value) {
    this.options.symbols = value
  }
  get stdout () {
    return this.options.stdout
  }
  set stdout (value) {
    this.options.stdout = value
  }
  get stderr () {
    return this.options.stderr
  }
  set stderr (value) {
    this.options.stderr = value
  }
  get isSpinning () {
    return this.id !== null
  }
}

module.exports = new Logger()
module.exports.Logger = Logger
module.exports.Table = Table
