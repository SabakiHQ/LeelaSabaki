const {spawn} = require('child_process')
const readline = require('readline')
const LineReadable = require('./LineReadable')

if (process.argv.length < 3) return

let lineReader = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''
})

let [, , leelaPath, ...leelaArgs] = process.argv
let leela = spawn(leelaPath, ['--gtp', ...leelaArgs])

let leelaOut = new LineReadable(leela.stdout, {newline: '\n\n'})
let leelaErr = new LineReadable(leela.stderr)

leela.on('exit', code => {
    process.exit(code)
})

leelaOut.on('line', line => {
    process.stdout.write(line + '\n\n')
})

leelaErr.on('line', line => {
    process.stderr.write(line + '\n')
})

lineReader.on('line', input => {
    leela.stdin.write(input + '\n')
})

lineReader.prompt()
