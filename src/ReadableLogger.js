module.exports = class ReadableLogger {
    constructor(readable) {
        this._log = ''
        this._enabled = false

        this.readable = readable

        this.readable.on('data', chunk => {
            if (!this._enabled) return
            this._log += chunk
        })
    }

    start() {
        this._log = ''
        this._enabled = true
    }

    stop() {
        this._enabled = false
        return this._log
    }
}
