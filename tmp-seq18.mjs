import { execSync } from 'node:child_process'
const s = execSync('git show 0f0047d:client/scripts/build-lattice.js', { encoding: 'utf8', maxBuffer: 20_000_000 })
const start = s.indexOf('const LATTICE_URLS')
const end = s.indexOf('];', start)
const block = s.slice(start, end)
const urls = [...block.matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1])
console.log('url count', urls.length)
urls.forEach((u, i) => {
  if (i >= 14 && i <= 22) console.log(String(i + 1).padStart(3), u)
})
const fnStart = s.indexOf('function buildSequenceMap')
console.log('\n--- buildSequenceMap ---')
console.log(s.slice(fnStart, fnStart + 700))
