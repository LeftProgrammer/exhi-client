import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { net } from 'electron'
import { logger } from './logger'
import { sha256File } from './hash'
import type { Manifest, ManifestFile } from '@shared/types'
import { PackageLoader, diffManifestFiles } from './package-loader'

/**
 * 内容同步器。
 *
 * 支持两种源 URL 形态：
 *  A) 整包 zip：url 以 .zip 结尾
 *     → 下载到临时文件 → 解压到目标槽（暂不实现 zip 解压，留待用 unzipper/yauzl 接入）
 *  B) 目录式：源服务器按 manifest 暴露 base 路径
 *     例：url = "https://content.example.com/baima/1.0.1/"
 *     → 先 GET <base>/manifest.json
 *     → 按 files 增量下载到目标槽（已存在且 sha256 匹配的跳过）
 *
 * M5 实现 B（目录式）：更符合"增量同步"的核心价值，且开发期用静态 server 就能测。
 *
 * 进度回调：用于上报中控进度事件。
 */

export interface SyncProgress {
  phase: 'fetch-manifest' | 'verify-local' | 'download' | 'verify-final' | 'done' | 'error'
  current?: number
  total?: number
  file?: string
  error?: string
}

export interface SyncOptions {
  /** 内容源 base URL（结尾必须 /） */
  url: string
  /** 期望版本号；与下载的 manifest.version 不符则失败 */
  expectedVersion?: string
  /** 目标槽（content-sync 会写入到此槽；不传则自动选非激活槽） */
  targetSlot?: string
  /** 进度回调 */
  onProgress?: (p: SyncProgress) => void
  /** 并发下载数 */
  concurrency?: number
}

export class ContentSync {
  constructor(private loader: PackageLoader) {}

  /** 执行一次完整同步 */
  async sync(options: SyncOptions): Promise<{ slot: string; manifest: Manifest }> {
    const onProgress = options.onProgress ?? (() => undefined)
    const baseUrl = options.url.endsWith('/') ? options.url : options.url + '/'

    onProgress({ phase: 'fetch-manifest' })

    // 1. 拉新版 manifest
    const manifestText = await this.fetchText(baseUrl + 'manifest.json')
    const manifest = JSON.parse(manifestText) as Manifest
    logger.info(`content-sync 拿到 manifest: ${manifest.projectId} v${manifest.version}`)
    if (options.expectedVersion && manifest.version !== options.expectedVersion) {
      throw new Error(
        `version mismatch: expected=${options.expectedVersion} got=${manifest.version}`
      )
    }
    if (!manifest.files?.length) {
      throw new Error('远端 manifest 缺少 files 清单，无法做增量同步')
    }

    // 2. 选目标槽（默认非激活槽）
    const current = this.loader.currentSlot()
    const target = options.targetSlot ?? (current ? this.loader.otherSlot(current) : 'slot-b')
    const targetDir = this.loader.ensureSlotDir(target)
    logger.info(`content-sync 目标槽: ${target} (${targetDir})`)

    // 3. 对比本地，跳过已有的 + 删除多余的
    onProgress({ phase: 'verify-local' })
    const { missing } = await diffManifestFiles(targetDir, manifest.files)
    await this.removeOrphans(targetDir, manifest.files)

    // 写入 manifest.json 与几个配置 JSON 总是覆盖（即使 sha 一样也无害）
    const alwaysFetch = ['manifest.json', 'displays.json', 'scenes.json', 'bindings.json']
    for (const name of alwaysFetch) {
      if (!missing.find((m) => m.path === name)) {
        // 不在 files 里 → 单独拉
        await this.downloadFile(baseUrl + name, path.join(targetDir, name))
      }
    }

    // 4. 下载缺失/不一致的文件
    const total = missing.length
    let done = 0
    const concurrency = options.concurrency ?? 3
    onProgress({ phase: 'download', current: done, total })
    await this.parallelMap(missing, concurrency, async (f) => {
      const dest = path.join(targetDir, f.path)
      await fsp.mkdir(path.dirname(dest), { recursive: true })
      await this.downloadFile(baseUrl + encodeURI(f.path), dest)
      const got = await sha256File(dest)
      if (got !== f.sha256) {
        throw new Error(`下载后 sha256 不符: ${f.path}`)
      }
      done++
      onProgress({ phase: 'download', current: done, total, file: f.path })
    })

    // 5. 最终校验整个槽
    onProgress({ phase: 'verify-final' })
    await this.loader.verifyPackage(targetDir)

    onProgress({ phase: 'done' })
    return { slot: target, manifest }
  }

  // ============ 内部 ============

  private fetchText(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = net.request(url)
      let body = ''
      req.on('response', (resp) => {
        if (resp.statusCode && resp.statusCode >= 400) {
          reject(new Error(`HTTP ${resp.statusCode} ${url}`))
          return
        }
        resp.on('data', (c: Buffer) => (body += c.toString('utf-8')))
        resp.on('end', () => resolve(body))
        resp.on('error', reject)
      })
      req.on('error', reject)
      req.end()
    })
  }

  private async downloadFile(url: string, dest: string): Promise<void> {
    const tmp = dest + '.tmp'
    await fsp.mkdir(path.dirname(dest), { recursive: true })
    // 用 Node net.request 流式写文件
    await new Promise<void>((resolve, reject) => {
      const req = net.request(url)
      req.on('response', async (resp) => {
        if (resp.statusCode && resp.statusCode >= 400) {
          reject(new Error(`HTTP ${resp.statusCode} ${url}`))
          return
        }
        try {
          await pipeline(resp as unknown as NodeJS.ReadableStream, fs.createWriteStream(tmp))
          resolve()
        } catch (e) {
          reject(e)
        }
      })
      req.on('error', reject)
      req.end()
    })
    await fsp.rename(tmp, dest)
  }

  /** 删除目标目录中不在 files 清单里的"孤儿"文件（避免老资源残留） */
  private async removeOrphans(rootDir: string, files: ManifestFile[]) {
    const wantSet = new Set<string>([
      'manifest.json',
      'displays.json',
      'scenes.json',
      'bindings.json',
      ...files.map((f) => f.path.replace(/\\/g, '/'))
    ])
    await this.walkAndPrune(rootDir, rootDir, wantSet)
  }

  private async walkAndPrune(root: string, dir: string, want: Set<string>) {
    if (!fs.existsSync(dir)) return
    for (const entry of await fsp.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      const rel = path.relative(root, full).replace(/\\/g, '/')
      if (entry.isDirectory()) {
        await this.walkAndPrune(root, full, want)
        // 空目录清掉
        const remaining = await fsp.readdir(full)
        if (remaining.length === 0) await fsp.rmdir(full)
      } else {
        if (!want.has(rel)) {
          await fsp.unlink(full)
          logger.debug(`移除孤儿文件: ${rel}`)
        }
      }
    }
  }

  /** 受限并发 map */
  private async parallelMap<T>(
    items: T[],
    concurrency: number,
    fn: (item: T) => Promise<void>
  ): Promise<void> {
    const queue = [...items]
    const workers = Array(Math.min(concurrency, queue.length))
      .fill(0)
      .map(async () => {
        while (queue.length) {
          const it = queue.shift()
          if (!it) break
          await fn(it)
        }
      })
    await Promise.all(workers)
  }
}
