module.exports = class StderrLogger {
    constructor(controller) {
        this._enabled = false

        this.controller = controller
        this.log = ''

        controller.on('stderr', ({content}) => {
            if (!this._enabled) return
            this.log += content.replace(/\r/g, '') + '\n'
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
