const {spawn} = require('child_process')

if (process.argv.length < 3) return

let [, , leelaPath, ...leelaArgs] = process.argv

const leela = spawn(leelaPath, ['--gtp', ...leelaArgs], {
    stdio: 'inherit'
})
