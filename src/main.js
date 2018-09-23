const pkg = require('../package')
const {Engine, Controller, Command, Response} = require('@sabaki/gtp')

let leelaPath = process.argv[2]
let leelaArgs = process.argv.slice(3)

if (leelaPath == null) return console.log(`
    ${pkg.productName} v${pkg.version}

    USAGE:
        ${pkg.name} <path-to-leela> [leela-arguments...]
`)

async function startEngine() {
    if (!leelaArgs.includes('--gtp') && !leelaArgs.includes('-g')) leelaArgs.push('--gtp')

    let engine = new Engine(pkg.productName, pkg.version)
    let controller = new Controller(leelaPath, leelaArgs)
    let relayStderr = true

    controller.start()
    controller.process.on('exit', code => process.exit(code))
    controller.on('stderr', ({content}) => relayStderr && process.stderr.write(content + '\n'))

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
                else out.write(firstLine ? line.replace(/^[?=]\d*\s*/, '') : '\n' + line)

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

    // Sabaki commands

    let parseInfoLine = line => line
        .split(/\s*info\s+/).slice(1)
        .map(x => x.split(/\s+/))
        .map(x => [x.slice(0, 8), x.slice(9)])
        .map(([[, vertex, , visits, , win, , order], variation]) => ({
            order,
            vertex,
            visits: +visits,
            win: +win / 100,
            variation
        }))
        .sort((x, y) => x.order - y.order)

    for (let name of ['analyze', 'genmove_analyze']) {
        engine.command(`sabaki-${name}`, async (command, out) => {
            let firstLine = true
            let error = false
            let leelaCommand = {name: `lz-${name}`, args: command.args}
            let lastMoves = null

            let response = await controller.sendCommand(leelaCommand, async ({line, end}) => {
                if (firstLine && line[0] === '?') error = true
                if (error) return
                if (end) return out.end()

                if (line.slice(0, 5) === 'info ') {
                    let moves = lastMoves = parseInfoLine(line)

                    line = '#' + JSON.stringify({
                        moves: moves.map(({vertex, visits, win}) => ({vertex, visits, win}))
                    })
                } else if (line.slice(0, 5) === 'play ') {
                    line += '\n#' + JSON.stringify({
                        variations: lastMoves.map(({visits, win, variation}) => ({visits, win, variation}))
                    })

                    // Continue pondering

                    if (!leelaArgs.includes('--noponder')) {
                        controller.sendCommand({name: 'lz-analyze', args: [10000]})
                    }
                }

                out.write(firstLine ? line.replace(/^[?=]\d*\s*/, '') : '\n' + line)
                firstLine = false
            })

            if (error) out.err(response.content)
        })
    }

    // Stop ongoing commands if possible

    engine.on('command-received', () => {
        controller.process.stdin.write('\n')
    })

    engine.start()
}

startEngine()
.catch(err => process.stderr.write(err))
