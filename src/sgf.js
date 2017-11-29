const gtpAlpha = 'ABCDEFGHJKLMNOPQRSTUVWXYZ'
const sgfAlpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

exports.coord2point = function coord2point(coord, size) {
    let x = gtpAlpha.indexOf(coord[0].toUpperCase())
    let y = size - +coord.substr(1)

    if (Math.min(x, y) < 0 || Math.max(x, y) >= sgfAlpha.length)
        return ''

    return sgfAlpha[x] + sgfAlpha[y]    
}
