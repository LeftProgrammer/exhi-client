/**
 * Shared utility functions for CLI tools.
 *
 * Consolidates duplicated helpers (exists, copyDir, runNode, runNpm, runNpx,
 * runProcess, parseOption) that were previously copy-pasted across:
 *   - tools/dist-cli/bin.mjs
 *   - tools/dist-display/bin.mjs
 *   - tools/pkg-assemble/bin.mjs
 *   - tools/pack-cli/bin.mjs
 *   - tools/content-server/bin.mjs
 *   - tools/release-cli/bin.mjs
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

/** Check if a path exists (async). */
export async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

/** Recursively copy a directory. */
export async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true })
  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) await copyDir(s, d)
    else await fs.copyFile(s, d)
  }
}

/** Spawn a child process and return a promise that resolves on exit 0. */
export function runProcess(cmd, args, cwd, extraEnv = {}, shell = false) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell,
      env: { ...process.env, ...extraEnv }
    })
    proc.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${path.basename(cmd)} exit ${code}`))
    )
    proc.on('error', reject)
  })
}

/** Run a Node.js script via the current process.execPath. */
export function runNode(nodeArgs, cwd, extraEnv = {}) {
  return runProcess(process.execPath, nodeArgs, cwd, extraEnv)
}

/** Run an npm command (cross-platform). */
export function runNpm(npmArgs, cwd, extraEnv = {}) {
  const isWin = process.platform === 'win32'
  return runProcess(isWin ? 'npm.cmd' : 'npm', npmArgs, cwd, extraEnv, isWin)
}

/** Run an npx command (cross-platform). */
export function runNpx(npxArgs, cwd, extraEnv = {}) {
  const isWin = process.platform === 'win32'
  return runProcess(isWin ? 'npx.cmd' : 'npx', npxArgs, cwd, extraEnv, isWin)
}

/** Parse --name=value from argv. Returns value string or null. */
export function parseOption(args, name) {
  for (const a of args) {
    if (a.startsWith(name + '=')) return a.slice(name.length + 1)
  }
  return null
}
