import { build } from 'esbuild'
import JavaScriptObfuscator from 'javascript-obfuscator'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

await mkdir('dist', { recursive: true })

await build({
  entryPoints: ['lib/index.js'],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  minify: true,
  sourcemap: false,
  legalComments: 'none',
  external: ['@deepseek-ai/*', 'node:*'],
  banner: {
    js: "import { createRequire as __amoayunCreateRequire } from 'node:module'; const require = __amoayunCreateRequire(import.meta.url);",
  },
})

const source = await readFile('dist/index.js', 'utf8')
const result = JavaScriptObfuscator.obfuscate(source, {
  compact: true,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  renameProperties: false,
  selfDefending: false,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  disableConsoleOutput: false,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  unicodeEscapeSequence: false,
})

await writeFile('dist/index.js', result.getObfuscatedCode())
console.log(`built dist/index.js (${(await readFile('dist/index.js')).length} bytes)`)
