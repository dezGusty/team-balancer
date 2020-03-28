const { execSync } = require('child_process')
const { createHash } = require('crypto')
const invertColor = require('invert-color')

const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString();
console.log('[branch]', branchName);

const hash = createHash('sha256')
hash.update(branchName)
const color = '#' + hash.digest().toString('hex').substring(0, 6)
const invertedColor = invertColor(color, true)

module.exports = `<svg viewBox="0 0 64 64" font-size="32" font-family="monospace,monospace" xmlns="http://www.w3.org/2000/svg">
  <rect y="6" width="64" height="32" fill="${color}"/>
  <text y="32" textLength="64" lengthAdjust="spacingAndGlyphs"
    fill="${invertedColor}">${branchName.substring(0, 4)}</text>
</svg>`

