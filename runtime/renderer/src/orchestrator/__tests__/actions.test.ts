import { describe, it, expect, beforeEach } from 'vitest'
import { registerAction, getAction, listActions, makeProjectHost } from '../actions'

/**
 * Tests for the action registration logic.
 * The built-in actions (scene.switch etc.) depend on Vue stores,
 * so here we test only the registration mechanism + project host validation.
 */

describe('action registry', () => {
  it('registers and retrieves an action by name', () => {
    const handler = async () => ({ ok: true as const })
    registerAction('test.myAction', handler)
    expect(getAction('test.myAction')).toBe(handler)
  })

  it('returns undefined for unregistered action', () => {
    expect(getAction('nonexistent.action')).toBeUndefined()
  })

  it('listActions includes registered actions', () => {
    registerAction('test.listed', async () => ({ ok: true as const }))
    expect(listActions()).toContain('test.listed')
  })

  it('overwrites existing action when re-registered', () => {
    const h1 = async () => ({ ok: true as const, data: { v: 1 } })
    const h2 = async () => ({ ok: true as const, data: { v: 2 } })
    registerAction('test.overwrite', h1)
    registerAction('test.overwrite', h2)
    expect(getAction('test.overwrite')).toBe(h2)
  })
})

describe('makeProjectHost', () => {
  let host: ReturnType<typeof makeProjectHost>

  beforeEach(() => {
    host = makeProjectHost()
  })

  it('registers a valid namespaced action', () => {
    const handler = async () => ({ ok: true as const })
    host.registerAction('mypkg.doStuff', handler)
    expect(getAction('mypkg.doStuff')).toBe(handler)
  })

  it('rejects action without namespace (no dot)', () => {
    const handler = async () => ({ ok: true as const })
    host.registerAction('noNamespace', handler)
    expect(getAction('noNamespace')).toBeUndefined()
  })

  it('rejects action with protected prefix scene.*', () => {
    const handler = async () => ({ ok: true as const })
    host.registerAction('scene.custom', handler)
    // Should not overwrite the built-in
    expect(getAction('scene.custom')).not.toBe(handler)
  })

  it('rejects action with protected prefix renderer.*', () => {
    const handler = async () => ({ ok: true as const })
    host.registerAction('renderer.hack', handler)
    expect(getAction('renderer.hack')).not.toBe(handler)
  })

  it('rejects action with protected prefix system.*', () => {
    const handler = async () => ({ ok: true as const })
    host.registerAction('system.shutdown', handler)
    expect(getAction('system.shutdown')).not.toBe(handler)
  })

  it('rejects action named exactly "macro"', () => {
    const handler = async () => ({ ok: true as const })
    host.registerAction('macro', handler)
    // "macro" has no dot so it's rejected by namespace check
    expect(getAction('macro')).not.toBe(handler)
  })

  it('allows actions with custom namespace', () => {
    const handler = async () => ({ ok: true as const })
    host.registerAction('custom.transition', handler)
    expect(getAction('custom.transition')).toBe(handler)
  })

  it('log() does not throw', () => {
    expect(() => host.log('test message')).not.toThrow()
  })
})
