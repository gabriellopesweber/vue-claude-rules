#!/usr/bin/env node
import { runBuild } from './build.mjs'
import { runInit } from './init.mjs'

const [command, ...rest] = process.argv.slice(2)

const flag = (name) => {
  const index = rest.indexOf(`--${name}`)
  return index === -1 ? null : rest[index + 1]
}

const usage = () => {
  console.log(`vue-claude-rules

  init [--profile <nome>] [--dist] [--force]
                                      detecta a stack, rascunha .claude/rules/project/ e prepara o package.json
  sync [--profile <nome>]             copia as regras para .claude/rules/shared/
  sync --check                        falha se shared/ divergir do pacote
  build --standalone [--out <dir>]    gera um .claude/ autocontido para distribuição
                                      (template à venda, boilerplate, entrega a cliente)

Adoção guiada por agente: veja ADOPTING.md no pacote.`)
}

switch (command) {
  case 'init':
    await runInit({
      cwd: process.cwd(),
      force: rest.includes('--force'),
      profileOverride: flag('profile'),
      distMode: rest.includes('--dist'),
    })
    break
  case 'sync':
    process.argv = [process.argv[0], process.argv[1], ...rest]
    await import('./sync.mjs')
    break
  case 'build':
    if (!rest.includes('--standalone')) {
      console.error('[build] só existe o modo --standalone hoje.')
      process.exit(1)
    }
    await runBuild({
      cwd: process.cwd(),
      out: flag('out') ?? 'dist-claude/.claude',
      projectName: flag('name'),
    })
    break
  default:
    usage()
    process.exit(command ? 1 : 0)
}
