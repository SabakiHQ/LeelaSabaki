const fs = require('fs')
const readline = require('readline')
const GTPEngine = require('./GTPEngine')

if (process.argv.length < 3) return

let stderrLog = ''
let logStderr = false

let lineReader = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''
})

let [, , path, ...args] = process.argv
let engine = new GTPEngine(path, ['--gtp', ...args])

engine.process.on('exit', code => process.exit(code))

engine.stderr.on('data', chunk => {
    process.stderr.write(chunk)
    if (logStderr) stderrLog += chunk
})

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

    if (name === 'genmove') logStderr = true

    engine.sendCommand(input).then(response => {
        process.stdout.write(response)
        
        if (name === 'genmove') {
            logStderr = false
            fs.writeFileSync('./log.txt', stderrLog)
            stderrLog = ''
        }
    })
})

lineReader.prompt()
