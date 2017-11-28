const readline = require('readline')
const GTPEngine = require('./GTPEngine')

if (process.argv.length < 3) return

let lineReader = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''
})

let [, , leelaPath, ...leelaArgs] = process.argv
let leela = new GTPEngine(leelaPath, ['--gtp', ...leelaArgs])

leela.process.on('exit', code => process.exit(code))
leela.stderr.on('line', line => process.stderr.write(`${line}\n`))

function getCommandName(input) {
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

    leela.sendCommand(input).then(response => {
        process.stdout.write(`${response}\n\n`)
    })
})

lineReader.prompt()
