import { describe, it, expect } from 'vitest'
import { stableStringify } from '../stable-json'

describe('stableStringify', () => {
  it('serializes primitives identically to JSON.stringify', () => {
    expect(stableStringify(null)).toBe('null')
    expect(stableStringify(42)).toBe('42')
    expect(stableStringify('hello')).toBe('"hello"')
    expect(stableStringify(true)).toBe('true')
  })

  it('sorts object keys alphabetically', () => {
    const obj = { z: 1, a: 2, m: 3 }
    expect(stableStringify(obj)).toBe('{"a":2,"m":3,"z":1}')
  })

  it('produces identical output regardless of key insertion order', () => {
    const a = { type: 'cmd', id: '1', ts: 100 }
    const b = { ts: 100, id: '1', type: 'cmd' }
    expect(stableStringify(a)).toBe(stableStringify(b))
  })

  it('handles nested objects with sorted keys at every level', () => {
    const obj = { b: { z: 1, a: 2 }, a: 'first' }
    expect(stableStringify(obj)).toBe('{"a":"first","b":{"a":2,"z":1}}')
  })

  it('preserves array order (does not sort arrays)', () => {
    const arr = [3, 1, 2]
    expect(stableStringify(arr)).toBe('[3,1,2]')
  })

  it('handles arrays of objects', () => {
    const arr = [
      { b: 2, a: 1 },
      { d: 4, c: 3 }
    ]
    expect(stableStringify(arr)).toBe('[{"a":1,"b":2},{"c":3,"d":4}]')
  })

  it('handles empty objects and arrays', () => {
    expect(stableStringify({})).toBe('{}')
    expect(stableStringify([])).toBe('[]')
  })

  it('handles deeply nested structures', () => {
    const obj = { c: { b: { a: 1 } } }
    expect(stableStringify(obj)).toBe('{"c":{"b":{"a":1}}}')
  })

  it('handles null values in objects', () => {
    const obj = { b: null, a: 'x' }
    expect(stableStringify(obj)).toBe('{"a":"x","b":null}')
  })

  it('handles undefined values (dropped like JSON.stringify)', () => {
    const obj = { a: 1, b: undefined }
    // JSON.stringify drops undefined values
    expect(stableStringify(obj)).toBe('{"a":1}')
  })
})
