import { describe, it, expect } from 'vitest'
import { resolveVars, type VarContext } from '../varSubst'

describe('resolveVars', () => {
  const ctx: VarContext = {
    payload: { sceneId: 'welcome', id: 7, nested: { deep: 'val' } },
    args: { name: 'opening', duration: 2000 },
    device: { deviceId: 'dev-001', displayId: 'main', runtimeVersion: '1.0.0' }
  }

  describe('full token replacement (preserves type)', () => {
    it('replaces $payload.x with the actual value', () => {
      const result = resolveVars({ sceneId: '$payload.sceneId' }, ctx)
      expect(result).toEqual({ sceneId: 'welcome' })
    })

    it('preserves number type', () => {
      const result = resolveVars({ id: '$payload.id' }, ctx)
      expect(result).toEqual({ id: 7 })
    })

    it('resolves $args.x', () => {
      const result = resolveVars({ name: '$args.name' }, ctx)
      expect(result).toEqual({ name: 'opening' })
    })

    it('resolves $device.x', () => {
      const result = resolveVars({ dev: '$device.deviceId' }, ctx)
      expect(result).toEqual({ dev: 'dev-001' })
    })

    it('resolves nested path ($payload.nested.deep)', () => {
      const result = resolveVars({ v: '$payload.nested.deep' }, ctx)
      expect(result).toEqual({ v: 'val' })
    })
  })

  describe('partial token replacement (string interpolation)', () => {
    it('interpolates token within a string', () => {
      const result = resolveVars({ tag: 'user-$payload.id' }, ctx)
      expect(result).toEqual({ tag: 'user-7' })
    })

    it('interpolates multiple tokens separated by space', () => {
      const result = resolveVars({ s: '$device.deviceId $payload.sceneId' }, ctx)
      expect(result).toEqual({ s: 'dev-001 welcome' })
    })

    it('replaces undefined nested token with empty string', () => {
      // Note: the regex treats `-` as a valid path segment character,
      // so $payload.missing-suffix is parsed as one token with path "missing-suffix"
      const result = resolveVars({ s: 'prefix/$payload.missing/suffix' }, ctx)
      expect(result).toEqual({ s: 'prefix//suffix' })
    })
  })

  describe('recursive resolution', () => {
    it('resolves nested objects', () => {
      const input = { outer: { inner: '$payload.sceneId' } }
      const result = resolveVars(input, ctx)
      expect(result).toEqual({ outer: { inner: 'welcome' } })
    })

    it('resolves arrays', () => {
      const input = { items: ['$payload.sceneId', '$args.name'] }
      const result = resolveVars(input, ctx)
      expect(result).toEqual({ items: ['welcome', 'opening'] })
    })
  })

  describe('edge cases', () => {
    it('returns null/undefined as-is', () => {
      expect(resolveVars(null, ctx)).toBeNull()
      expect(resolveVars(undefined, ctx)).toBeUndefined()
    })

    it('returns non-string primitives unchanged', () => {
      expect(resolveVars(42, ctx)).toBe(42)
      expect(resolveVars(true, ctx)).toBe(true)
    })

    it('returns strings without $ unchanged', () => {
      expect(resolveVars('hello world', ctx)).toBe('hello world')
    })

    it('handles missing root gracefully', () => {
      const result = resolveVars({ v: '$unknown.key' }, ctx)
      expect(result).toEqual({ v: undefined })
    })

    it('handles empty context', () => {
      const result = resolveVars({ v: '$payload.x' }, {})
      expect(result).toEqual({ v: undefined })
    })

    it('handles null in nested path', () => {
      const ctx2: VarContext = { payload: { a: null } }
      const result = resolveVars({ v: '$payload.a.b' }, ctx2)
      expect(result).toEqual({ v: undefined })
    })
  })
})
