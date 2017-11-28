const EventEmitter = require('events')

module.exports = class LineReadable extends EventEmitter {
    constructor(readable, {newline = '\n'} = {}) {
        super()

        this._buffer = ''
        this.readable = readable
        this.newline = newline

        readable.on('data', chunk => {
            this._buffer += chunk

            let newlineIndex = this._buffer.lastIndexOf(newline)

            if (newlineIndex >= 0) {
                let lines = this._buffer.slice(0, newlineIndex).split(newline)

                for (let line of lines) {
                    this.emit('line', line)
                }

                this._buffer = this._buffer.slice(newlineIndex + newline.length)
            }
        })
    }
}
