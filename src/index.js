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
leela.stderr.on('line', line => process.stderr.write(line + '\n'))

lineReader.on('line', input => {
    leela.sendCommand(input, response => {
        process.stdout.write(response + '\n\n')
    })
})

lineReader.prompt()
