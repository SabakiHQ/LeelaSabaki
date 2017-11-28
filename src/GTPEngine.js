const {spawn} = require('child_process')
const EventEmitter = require('events')
const LineReadable = require('./LineReadable')

module.exports = class GTPEngine {
    constructor(path, args) {
        this._id = 0
        this._events = new EventEmitter()

        this.process = spawn(path, args)
        this.commandQueue = []

        this.stdout = new LineReadable(this.process.stdout, {newline: '\n\n'})
        this.stderr = new LineReadable(this.process.stderr)

        this.stdout.on('line', response => {
            if (this.commandQueue.length === 0) return

            let {id} = this.commandQueue.shift()
            this._events.emit(`response-${id}`, response)
        })
    }

    sendCommand(command, callback = () => {}) {
        let id = this._id++
        
        this.commandQueue.push({id, command})
        this.process.stdin.write(`${command}\n`)

        this._events.once(`response-${id}`, (...args) => {
            setTimeout(() => callback(...args), 0)
        })
    }
}
