import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'

/**
 * 流式计算文件 SHA256（小写 hex）。
 * 用流避免大视频文件全部读入内存。
 */
export function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const h = createHash('sha256')
    const s = createReadStream(filePath)
    s.on('data', (chunk) => h.update(chunk))
    s.on('end', () => resolve(h.digest('hex')))
    s.on('error', reject)
  })
}

/**
 * 计算整包"全部文件 sha256 拼接后再 sha256"——manifest.checksum 用这个。
 * 输入要按 path 升序排列后再拼，保证跨平台一致。
 */
export function aggregateChecksum(entries: { path: string; sha256: string }[]): string {
  const h = createHash('sha256')
  const sorted = [...entries].sort((a, b) => a.path.localeCompare(b.path))
  for (const e of sorted) h.update(e.path + ':' + e.sha256 + '\n')
  return h.digest('hex')
}
