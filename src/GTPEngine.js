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

        this.stdout.on('data', response => {
            if (this.commandQueue.length === 0) return

            let {id} = this.commandQueue.shift()
            this._events.emit(`response-${id}`, response)
        })
    }

    parseCommand(input) {
        if (input.trim() === '') return null

        let inputs = input.split(/\s+/)
        let id = parseFloat(inputs[0])

        if (!isNaN(id) && id + '' === inputs[0]) inputs.shift()
        else id = null

        let [name, ...args] = inputs
        return {id, name, args}
    }

    sendCommand(input) {
        let id = this._id++
        
        this.commandQueue.push({id, input})
        this.process.stdin.write(`${input}\n`)

        return new Promise(resolve => {
            this._events.once(`response-${id}`, response => {
                setTimeout(() => resolve(response), 0)
            })
        })
    }
}
