const {version} = require('./package')
const commander = require('commander')
const {spawn} = require('child_process')
const readline = require('readline')

commander
.version(version)
.arguments('<leelaPath> [leelaArgs...]')
.action((leelaPath, leelaArgs) => {
    const leela = spawn(leelaPath, ['--gtp', ...leelaArgs], {
        stdio: 'inherit'
    })
})

commander.parse(process.argv)
