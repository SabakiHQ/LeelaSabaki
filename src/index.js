const pkg = require('../package')
const fs = require('fs')
const readline = require('readline')
const {coord2point} = require('./sgf')
const GTPEngine = require('./GTPEngine')
const ReadableLogger = require('./ReadableLogger')

let leelaArgIndex = process.argv.findIndex((x, i) => i >= 2 && x.indexOf('-') !== 0)
let args = process.argv.slice(2, leelaArgIndex)

if (leelaArgIndex < 0 || args.includes('--help')) return console.log(`
    ${pkg.productName} v${pkg.version}

    USAGE:
        ${pkg.name} [--flat] [--help] <path-to-leela> [leela-arguments...]

    OPTIONS:
        --flat
            Instead of appending variations as multiple moves, we will append one
            node per variation with the final board arrangement and move numbers.

        --help
            Shows this help message.
`)

let lineReader = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''
})

let leelaArgv = [...process.argv.slice(leelaArgIndex), '--gtp']
let engine = new GTPEngine(...leelaArgv)
let stderrLogger = new ReadableLogger(engine.stderr)

let state = {
    size: 19,
    genmoveColor: 'B'
}

engine.process.on('exit', code => process.exit(code))
engine.stderr.on('data', chunk => process.stderr.write(chunk))

function log2json(log) {
    let lines = log.split('\n')

    let variationsStartIndex = lines.findIndex(line => line.includes('MC winrate=') || line.includes('NN eval='))
    if (variationsStartIndex < 0) variationsStartIndex = lines.length

    let heatmapStartIndex = lines.findIndex(line => line.match(/^\s+(\d+\s+)+$/) != null)
    if (heatmapStartIndex < 0) heatmapStartIndex = lines.length

    let colors = [state.genmoveColor, state.genmoveColor === 'B' ? 'W' : 'B']
    
    return {
        heatmap: (([max, data]) => data.map(x => x.map(y => Math.floor(y * 9.9 / max))))(
            (data => [Math.max(...data.map(x => Math.max(...x))), data])
            (lines
                .slice(heatmapStartIndex, heatmapStartIndex + state.size)
                .map(line => line.trim().split(/\s+/).map(x => +x)))
        ),

        variations: lines
            .slice(variationsStartIndex)
            .filter(line => line.includes('->'))
            .map(line => ({
                visits: +line.slice(line.indexOf('->') + 2, line.indexOf('(')).trim(),
                stats: line.slice(line.indexOf('('), line.indexOf('PV: ')).trim()
                    .replace(/\s+/g, ' ').slice(1, -1).split(') (')
                    .reduce((acc, x) => Object.assign(acc, {[x[0]]: x.slice(x.indexOf(':') + 2)}), {}),
                variation: line.slice(line.indexOf('PV: ') + 4).trim().split(/\s+/)
            }))
            .filter(({visits, variation}) => variation.length >= 4)
            .map(({visits, stats, variation}) =>
                `(;C[${
                    [
                        `- \`${visits}\` visits`,
                        Object.keys(stats).map(key => `  - **${key}** \`${stats[key]}\``).join('\n')
                    ].join('\n')
                }]${
                    args.includes('--flat')

                    ? variation.reduce(([AB, AW, LB], x, i) => {
                        let list = colors[i % 2] === 'B' ? AB : AW
                        let point = coord2point(x, state.size)

                        if (point !== '') {
                            list.push(point)
                            LB.push(`${point}:${i + 1}`)
                        }

                        return [AB, AW, LB]
                    }, [[], [], []]).map((list, i) =>
                        `${['AB', 'AW', 'LB'][i]}[${list.join('][')}]`
                    ).join('')

                    : variation
                    .map((x, i) => `${colors[i % 2]}[${coord2point(x, state.size)}]`)
                    .join(';')
                })`
            )
            .join('')
    }
}

lineReader.on('line', async input => {
    let command = engine.parseCommand(input)
    if (command == null) return

    let {id, name, args} = command
    if (id == null) id = ''

    if (name === 'sabaki-genmovelog') {
        let {log} = stderrLogger

        stderrLogger.start()
        
        await new Promise(resolve => {
            let counter = state.size
            let dataHandler = chunk => {
                if (chunk.match(/^\s+(\d+\s+)+$/) != null) {
                    counter--
                }

                if (counter === 0) {
                    engine.stderr.removeListener('data', dataHandler)
                    resolve()
                }
            }

            engine.stderr.on('data', dataHandler)
            engine.sendCommand('heatmap')
        })
        
        stderrLogger.stop()
        log += stderrLogger.log

        let data = log2json(log)
        process.stdout.write(`=${id} #sabaki${JSON.stringify(data)}\n\n`)
        
        return
    } else if (name === 'known_command' && args[0] === 'sabaki-genmovelog') {
        process.stdout.write(`=${id} true\n\n`)
        return
    }

    if (name === 'genmove') stderrLogger.start()

    let response = await engine.sendCommand(input)

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

lineReader.prompt()
