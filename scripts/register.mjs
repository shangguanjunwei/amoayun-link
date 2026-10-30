#!/usr/bin/env node
/**
 * Add dsh-amoayun-link-plugin to a DeepSeek Harness profile's bundle list.
 *
 * Run this after installing the package into the profile:
 *   dsh plugin --profile web add /path/to/dsh-amoayun-link-plugin
 *   node /path/to/dsh-amoayun-link-plugin/scripts/register.mjs web
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const PLUGIN = 'dsh-amoayun-link-plugin'
const dshHome = (process.env.DSH_HOME ?? '').trim() || join(homedir(), '.dsh')
const profileName =
  (process.argv[2] ?? '').trim() || (process.env.DSH_PROFILE ?? '').trim() || 'web'
const profileDir = join(dshHome, 'profiles', profileName)
const manifestPath = join(profileDir, 'package.json')

if (!existsSync(manifestPath)) {
  console.error(`找不到 profile：${manifestPath}`)
  console.error(`请先运行：dsh plugin --profile ${profileName} add ${join(import.meta.dirname, '..')}`)
  process.exit(1)
}

let manifest
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
} catch (error) {
  console.error(`无法解析 ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}

manifest.dsh ??= {}
manifest.dsh.profile ??= {}
const bundles = Array.isArray(manifest.dsh.profile.bundles) ? manifest.dsh.profile.bundles : []
if (!bundles.includes(PLUGIN)) bundles.push(PLUGIN)
manifest.dsh.profile.bundles = bundles

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`已把 ${PLUGIN} 加入 ${manifestPath}`)
console.log(`启动：dsh --profile ${profileName}`)
