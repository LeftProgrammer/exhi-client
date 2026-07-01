import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { sha256File, aggregateChecksum } from '../hash'

describe('sha256File', () => {
  const testDir = join(tmpdir(), 'exhi-hash-test-' + Date.now())

  beforeAll(() => {
    mkdirSync(testDir, { recursive: true })
  })

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  it('computes correct sha256 for a text file', async () => {
    const content = 'hello world'
    const file = join(testDir, 'hello.txt')
    writeFileSync(file, content)

    const expected = createHash('sha256').update(content).digest('hex')
    const result = await sha256File(file)
    expect(result).toBe(expected)
  })

  it('computes correct sha256 for an empty file', async () => {
    const file = join(testDir, 'empty.txt')
    writeFileSync(file, '')

    const expected = createHash('sha256').update('').digest('hex')
    const result = await sha256File(file)
    expect(result).toBe(expected)
  })

  it('computes correct sha256 for binary content', async () => {
    const buf = Buffer.from([0x00, 0xff, 0x42, 0xab, 0xcd])
    const file = join(testDir, 'binary.bin')
    writeFileSync(file, buf)

    const expected = createHash('sha256').update(buf).digest('hex')
    const result = await sha256File(file)
    expect(result).toBe(expected)
  })

  it('rejects on non-existent file', async () => {
    await expect(sha256File(join(testDir, 'no-such-file.txt'))).rejects.toThrow()
  })
})

describe('aggregateChecksum', () => {
  it('produces a deterministic checksum sorted by path', () => {
    const entries = [
      { path: 'b.txt', sha256: 'bbb' },
      { path: 'a.txt', sha256: 'aaa' }
    ]
    const result = aggregateChecksum(entries)

    // Manual expected: sort by path → a.txt:aaa\nb.txt:bbb\n → sha256
    const h = createHash('sha256')
    h.update('a.txt:aaa\n')
    h.update('b.txt:bbb\n')
    const expected = h.digest('hex')

    expect(result).toBe(expected)
  })

  it('is order-independent (input order does not affect result)', () => {
    const entries1 = [
      { path: 'z.mp4', sha256: 'zzz' },
      { path: 'a.html', sha256: 'aaa' },
      { path: 'm.json', sha256: 'mmm' }
    ]
    const entries2 = [
      { path: 'a.html', sha256: 'aaa' },
      { path: 'm.json', sha256: 'mmm' },
      { path: 'z.mp4', sha256: 'zzz' }
    ]
    expect(aggregateChecksum(entries1)).toBe(aggregateChecksum(entries2))
  })

  it('returns correct hash for empty entries', () => {
    const result = aggregateChecksum([])
    const expected = createHash('sha256').digest('hex')
    expect(result).toBe(expected)
  })

  it('returns correct hash for single entry', () => {
    const entries = [{ path: 'index.html', sha256: 'abc123' }]
    const h = createHash('sha256')
    h.update('index.html:abc123\n')
    expect(aggregateChecksum(entries)).toBe(h.digest('hex'))
  })

  it('does not mutate the input array', () => {
    const entries = [
      { path: 'b.txt', sha256: 'bbb' },
      { path: 'a.txt', sha256: 'aaa' }
    ]
    const copy = [...entries]
    aggregateChecksum(entries)
    expect(entries).toEqual(copy)
  })
})
