module.exports = class ReadableLogger {
    constructor(readable) {
        this._enabled = false

        this.readable = readable
        this.log = ''

        this.readable.on('data', chunk => {
            if (!this._enabled) return
            this.log += chunk.replace(/\r/g, '')
        })
    }

    start() {
        this.log = ''
        this._enabled = true
    }

    stop() {
        this._enabled = false
    }
}
