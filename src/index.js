const fs = require('fs')
const readline = require('readline')
const {coord2point} = require('./sgf')
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

let state = {
    size: 19,
    genmoveColor: 'B'
}

engine.process.on('exit', code => process.exit(code))
engine.stderr.on('data', chunk => process.stderr.write(chunk))

function log2json(log) {
    let result = {}
    let lines = log.split('\n')
    let startIndex = lines.findIndex(line => line.includes('MC winrate='))

    if (startIndex >= 0) {
        lines = lines.slice(startIndex).filter(line => line.includes('->'))
    } else {
        lines = []
    }

    let colors = [state.genmoveColor, state.genmoveColor === 'B' ? 'W' : 'B']

    return {
        variations: lines.map(line =>
            `(;${
                line.slice(line.indexOf('PV: ') + 4).trim().split(/\s+/)
                .map((x, i) => `${colors[i % 2]}[${coord2point(x, state.size)}]`)
                .join(';')
            }C[${
                line.slice(line.indexOf('('), line.indexOf('PV: ')).trim()
                .replace(/\s+/g, ' ').slice(1, -1).split(') (')
                .map(x => `- **${x[0]}** ${x.slice(x.indexOf(':') + 2)}`)
                .join('\n')
            }])`
        ).join('')
    }
}

lineReader.on('line', input => {
    let command = engine.parseCommand(input)
    if (command == null) return

    let {id, name, args} = command
    if (id == null) id = ''

    if (name === 'sabaki-genmovelog') {
        let data = log2json(stderrLogger.log)
        process.stdout.write(`=${id} #sabaki${JSON.stringify(data)}\n\n`)
        return
    } else if (name === 'known_command' && args[0] === 'sabaki-genmovelog') {
        process.stdout.write(`=${id} true\n\n`)
        return
    }

    if (name === 'genmove') stderrLogger.start()

    engine.sendCommand(input).then(response => {
        process.stdout.write(response.trim())
        
        if (name === 'genmove') {
            stderrLogger.stop()
            if (response[0] === '=') state.genmoveColor = args[0][0].toUpperCase()
        } else if (name === 'list_commands') {
            process.stdout.write('\nsabaki-genmovelog')
        } else if (name === 'boardsize') {
            if (response[0] === '=') state.size = +args[0]
        }

        process.stdout.write('\n\n')
    })
})

lineReader.prompt()
