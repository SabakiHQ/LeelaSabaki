const fs = require('fs')
const readline = require('readline')
const GTPEngine = require('./GTPEngine')
const ReadableLogger = require('./ReadableLogger')

if (process.argv.length < 3) return

let lineReader = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''
})

let [, , path, ...args] = process.argv
let engine = new GTPEngine(path, ['--gtp', ...args])
let stderrLogger = new ReadableLogger(engine.stderr)

engine.process.on('exit', code => process.exit(code))
engine.stderr.on('data', chunk => process.stderr.write(chunk))

function getCommandName(input) {
    if (input.trim() === '') return null

    let inputs = input.split(/\s+/)

    if (!isNaN(inputs[0]) && parseFloat(inputs[0]) + '' === inputs[0]) {
        inputs.shift()
    }

    if (inputs.length === 0) return null
    return inputs[0]
}

lineReader.on('line', input => {
    let name = getCommandName(input)
    if (name == null) return

    if (name === 'genmove') stderrLogger.start()

    engine.sendCommand(input).then(response => {
        process.stdout.write(response)
        
        if (name === 'genmove') {
            fs.writeFileSync('./log.txt', stderrLogger.stop())
        }
    })
})

lineReader.prompt()
