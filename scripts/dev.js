import { spawn } from 'node:child_process'
import process from 'node:process'
import { resolve } from 'node:path'

let api
let vite
let shuttingDown = false
let viteStarted = false

function stop(exitCode = 0) {
  if (shuttingDown) return
  shuttingDown = true
  process.exitCode = exitCode
  if (vite && vite.exitCode === null) vite.kill()
  if (api && api.exitCode === null) api.kill()
}

function startVite() {
  if (viteStarted || shuttingDown) return
  viteStarted = true
  vite = spawn(process.execPath, [
    resolve('node_modules/vite/bin/vite.js'),
    ...process.argv.slice(2),
  ], { stdio: 'inherit' })

  vite.on('error', (error) => {
    console.error('Failed to start Vite:', error)
    stop(1)
  })
  vite.on('exit', (code) => stop(code ?? 1))
}

api = spawn(process.execPath, ['backend/server.js'], {
  stdio: ['inherit', 'pipe', 'inherit'],
})

api.stdout.on('data', (chunk) => {
  process.stdout.write(chunk)
  if (chunk.toString().includes('EcoGuard API listening on')) startVite()
})
api.on('error', (error) => {
  console.error('Failed to start the EcoGuard API:', error)
  stop(1)
})
api.on('exit', (code) => {
  if (!shuttingDown) {
    if (code !== 0) console.error(`EcoGuard API exited unexpectedly with code ${code ?? 'unknown'}`)
    stop(code ?? 1)
  }
})

process.once('SIGINT', () => stop(0))
process.once('SIGTERM', () => stop(0))
