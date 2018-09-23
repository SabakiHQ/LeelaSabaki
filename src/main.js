const pkg = require('../package')
const {Engine, Controller, Command, Response} = require('@sabaki/gtp')
const {coord2point} = require('./sgf')

let leelaArgIndex = process.argv.findIndex((x, i) => i >= 2 && x.indexOf('-') !== 0)
let globalArgs = process.argv.slice(2, leelaArgIndex)

let state = {
    size: 19,
    genmoveColor: 'B'
}

if (leelaArgIndex < 0 || globalArgs.includes('--help')) return console.log(`
    ${pkg.productName} v${pkg.version}

    USAGE:
        ${pkg.name} [--flat] [--heatmap] [--help] <path-to-leela> [leela-arguments...]

    OPTIONS:
        --flat
            Instead of appending variations as multiple moves, we will append one
            node per variation with the final board arrangement and move numbers.

        --heatmap
            Visualizes network probabilities as a heatmap.

        --help
            Shows this help message.
`)

async function startEngine() {
    let [leelaPath, ...leelaArgs] = [...process.argv.slice(leelaArgIndex)]
    if (!leelaArgs.includes('--gtp') && !leelaArgs.includes('-g')) leelaArgs.push('--gtp')

    let engine = new Engine(pkg.productName, pkg.version)
    let controller = new Controller(leelaPath, leelaArgs)

    controller.start()
    controller.process.on('exit', code => process.exit(code))
    controller.on('stderr', ({content}) => process.stderr.write(content + '\n'))

    // Inherit commands from Leela

    let response = await controller.sendCommand({name: 'list_commands'})
    let commands = response.content.split('\n')
        .filter(x => !['name', 'version', 'list_commands'].includes(x))

    for (let name of commands) {
        engine.command(name, async (command, out) => {
            let firstLine = true
            let error = false

            let response = await controller.sendCommand(command, ({line, end}) => {
                if (firstLine && line[0] === '?') error = true
                if (error) return

                if (end) out.end()
                else out.write(firstLine ? line.replace(/^[?=](\d+)?\s*/, '') : '\n' + line)

                firstLine = false
            })

            if (error) out.err(response.content)
        })
    }

    for (let name of ['name', 'version']) {
        engine.command(name, async (command, out) => {
            let {content} = await controller.sendCommand(command)
            out.send(`${name === 'name' ? pkg.productName : pkg.version} (${content})`)
        })
    }

    // Hooks for state management

    engine.on('command-processed', (command, response) => {
        if (command.name === 'boardsize') {
            if (!response.error && command.args.length > 0) {
                state.size = +command.args[0]
            }
        }
    })

    // Stop ongoing commands if possible

    engine.on('command-received', () => {
        controller.process.stdin.write('# stop\n')
    })

    engine.start()
}

startEngine()
.catch(err => process.stderr.write(err))
